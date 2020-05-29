package ru.mail.jira.plugins.groovy.util;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.datetime.DateTimeFormatter;
import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.IssueManager;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.github.difflib.DiffUtils;
import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.algorithm.DiffException;
import com.github.difflib.patch.Patch;
import com.google.common.collect.ImmutableMap;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dto.ChangelogDto;
import ru.mail.jira.plugins.groovy.api.dto.JiraIssueReference;
import ru.mail.jira.plugins.groovy.api.entity.AbstractChangelog;
import ru.mail.jira.plugins.groovy.api.entity.FieldConfigChangelog;
import ru.mail.jira.plugins.groovy.api.repository.ExecutionRepository;

import java.sql.Timestamp;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public final class ChangelogHelper {
    private static final Pattern ISSUE_KEY_PATTERN = Pattern.compile("((?<!([A-Za-z]{1,10})-?)[A-Z]+-\\d+)");

    private final DateTimeFormatter dateTimeFormatter;
    private final IssueManager issueManager;
    private final ActiveObjects ao;
    private final ExecutionRepository executionRepository;
    private final UserMapper userMapper;

    @Autowired
    public ChangelogHelper(
        @ComponentImport DateTimeFormatter dateTimeFormatter,
        @ComponentImport IssueManager issueManager,
        @ComponentImport ActiveObjects ao,
        ExecutionRepository executionRepository,
        UserMapper userMapper
    ) {
        this.dateTimeFormatter = dateTimeFormatter;
        this.issueManager = issueManager;
        this.ao = ao;
        this.executionRepository = executionRepository;
        this.userMapper = userMapper;
    }

    public String generateDiff(long id, String originalName, String name, String originalSource, String newSource) {
        if (originalSource == null) {
            originalSource = "";
        }
        if (newSource == null) {
            newSource = "";
        }

        try {
            List<String> originalLines = Arrays.asList(originalSource.split("\n"));
            List<String> newLines = Arrays.asList(newSource.split("\n"));
            Patch<String> patch = DiffUtils.diff(originalLines, newLines);

            return UnifiedDiffUtils
                .generateUnifiedDiff(genName(id, originalName), genName(id, name), originalLines, patch, 5)
                .stream()
                .collect(Collectors.joining("\n"));
        } catch (DiffException e) {
            throw new RuntimeException("Unable to create diff", e);
        }
    }

    private ChangelogDto buildDto(AbstractChangelog changelog) {
        ChangelogDto result = new ChangelogDto();

        result.setId(changelog.getID());
        result.setUuid(changelog.getUuid());
        result.setAuthor(userMapper.buildUser(changelog.getAuthorKey()));
        result.setComment(changelog.getComment());
        result.setDate(dateTimeFormatter.forLoggedInUser().format(changelog.getDate()));

        if (changelog instanceof FieldConfigChangelog) {
            result.setTemplateDiff(((FieldConfigChangelog) changelog).getTemplateDiff());
        }

        Set<JiraIssueReference> issueReferences = new HashSet<>();

        Matcher issueKeyMatcher = ISSUE_KEY_PATTERN.matcher(changelog.getComment());
        while (issueKeyMatcher.find()) {
            String issueKey = issueKeyMatcher.group();

            Issue issue = issueManager.getIssueByCurrentKey(issueKey);
            if (issue != null) {
                issueReferences.add(new JiraIssueReference(issue.getKey(), issue.getSummary()));
            }
        }

        result.setIssueReferences(issueReferences);

        return result;
    }

    public List<ChangelogDto> collect(String originalSource, AbstractChangelog[] changelogs) {
        if (changelogs != null) {
            Set<String> ids = Arrays
                .stream(changelogs)
                .map(AbstractChangelog::getUuid)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            Map<String, Long> errors = executionRepository.getErrorCount(ids);
            Map<String, Long> warnings = executionRepository.getWarningCount(ids);

            List<AbstractChangelog> toSort = new ArrayList<>();
            for (AbstractChangelog changelog : changelogs) {
                toSort.add(changelog);
            }
            toSort.sort(Comparator.comparing(AbstractChangelog::getDate).reversed());

            List<String> currentSource = Arrays.asList(originalSource.split("\n"));
            List<ChangelogDto> list = new ArrayList<>();
            for (AbstractChangelog changelog : toSort) {
                ChangelogDto changelogDto = buildDto(changelog);

                changelogDto.setAfter(String.join("\n", currentSource));
                currentSource = DiffUtils.unpatch(currentSource, UnifiedDiffUtils.parseUnifiedDiff(Arrays.asList(changelog.getDiff().split("\n"))));
                changelogDto.setBefore(String.join("\n", currentSource));

                String uuid = changelogDto.getUuid();
                if (uuid != null) {
                    changelogDto.setErrors(errors.getOrDefault(uuid, 0L));
                    changelogDto.setWarnings(warnings.getOrDefault(uuid, 0L));
                }

                list.add(changelogDto);
            }
            return list;
        }
        return null;
    }

    public void addChangelog(Class<? extends AbstractChangelog> clazz, int scriptId, String uuid, String userKey, String diff, String comment) {
        addChangelog(clazz, "SCRIPT_ID", scriptId, uuid, userKey, diff, comment);
    }

    public void addChangelog(Class<? extends AbstractChangelog> clazz, String fkField, int scriptId, String uuid, String userKey, String diff, String comment) {
        addChangelog(clazz, fkField, scriptId, uuid, userKey, diff, comment, ImmutableMap.of());
    }

    public void addChangelog(
        Class<? extends AbstractChangelog> clazz,
        String fkField,
        int scriptId,
        String uuid,
        String userKey,
        String diff,
        String comment,
        Map<String, Object> additionalParams
    ) {
        Map<String, Object> params = new HashMap<>();
        params.put("AUTHOR_KEY", userKey);
        params.put(fkField, scriptId);
        params.put("DATE", new Timestamp(System.currentTimeMillis()));
        params.put("DIFF", StringUtils.isEmpty(diff) ? "no changes" : diff);
        params.put("COMMENT", comment);
        params.put("UUID", uuid);
        params.putAll(additionalParams);

        ao.create(
            clazz,
            params
        );
    }

    private static String genName(long id, String name) {
        return String.valueOf(id) + " - " + name + ".groovy";
    }
}
