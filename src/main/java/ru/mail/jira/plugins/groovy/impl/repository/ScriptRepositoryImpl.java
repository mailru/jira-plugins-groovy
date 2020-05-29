package ru.mail.jira.plugins.groovy.impl.repository;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.beehive.ClusterLock;
import com.atlassian.beehive.ClusterLockService;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import net.java.ao.Query;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dao.RegistryDao;
import ru.mail.jira.plugins.groovy.api.dto.PickerOption;
import ru.mail.jira.plugins.groovy.util.*;
import ru.mail.jira.plugins.groovy.api.dto.workflow.WorkflowScriptType;
import ru.mail.jira.plugins.groovy.api.repository.ExecutionRepository;
import ru.mail.jira.plugins.groovy.api.repository.ScriptRepository;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.api.dto.*;
import ru.mail.jira.plugins.groovy.api.dto.directory.*;
import ru.mail.jira.plugins.groovy.api.entity.*;
import ru.mail.jira.plugins.groovy.api.service.ScriptInvalidationService;
import ru.mail.jira.plugins.groovy.api.script.ParseContext;

import java.text.Collator;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@ExportAsService(ScriptRepository.class)
public class ScriptRepositoryImpl implements ScriptRepository {
    private static final Collator COLLATOR = Collator.getInstance();

    private final I18nHelper i18nHelper;
    private final ClusterLockService clusterLockService;
    private final ActiveObjects ao;
    private final ScriptInvalidationService scriptInvalidationService;
    private final RegistryDao registryDao;
    private final ScriptService scriptService;
    private final JsonMapper jsonMapper;
    private final ExecutionRepository executionRepository;
    private final ChangelogHelper changelogHelper;

    @Autowired
    public ScriptRepositoryImpl(
        @ComponentImport I18nHelper i18nHelper,
        @ComponentImport ClusterLockService clusterLockService,
        @ComponentImport ActiveObjects ao,
        ScriptInvalidationService scriptInvalidationService,
        RegistryDao registryDao,
        ScriptService scriptService,
        JsonMapper jsonMapper,
        ExecutionRepository executionRepository,
        ChangelogHelper changelogHelper
    ) {
        this.i18nHelper = i18nHelper;
        this.clusterLockService = clusterLockService;
        this.ao = ao;
        this.scriptInvalidationService = scriptInvalidationService;
        this.registryDao = registryDao;
        this.scriptService = scriptService;
        this.jsonMapper = jsonMapper;
        this.executionRepository = executionRepository;
        this.changelogHelper = changelogHelper;
    }

    @Override
    public List<ScriptDirectoryDto> getAllDirectories() {
        return Arrays
            .stream(ao.find(ScriptDirectory.class, Query.select().where("DELETED = ?", Boolean.FALSE)))
            .map(directory -> {
                ScriptDirectoryDto result = new ScriptDirectoryDto();

                result.setId(directory.getID());
                result.setName(directory.getName());
                if (directory.getParent() != null) {
                    result.setParentId(directory.getParent().getID());
                }

                return result;
            })
            .collect(Collectors.toList());
    }

    @Override
    public List<RegistryScriptDto> getAllScripts() {
        Map<Integer, Long> errors = executionRepository.getRegistryErrorCount();
        Map<Integer, Long> warnings = executionRepository.getRegistryWarningCount();

        List<RegistryScriptDto> scripts = Arrays
            .stream(ao.find(Script.class, Query.select().where("DELETED = ?", Boolean.FALSE)))
            .map(script -> buildScriptDto(script, false, false, false, false))
            .collect(Collectors.toList());

        for (RegistryScriptDto scriptDto : scripts) {
            scriptDto.setErrorCount(errors.get(scriptDto.getId()));
            scriptDto.setWarningCount(warnings.get(scriptDto.getId()));
        }

        return scripts;
    }

    @Override
    public PickerResultSet<PickerOption> getAllDirectoriesForPicker() {
        Map<Integer, ScriptDirectoryDto> directories = getAllDirectories()
            .stream()
            .collect(Collectors.toMap(
                ScriptDirectoryDto::getId,
                Function.identity()
            ));

        List<PickerOption> options = directories
            .values()
            .stream()
            .map(directory -> new PickerOption(ScriptUtil.getExpandedName(directories, directory), String.valueOf(directory.getId()), null))
            .sorted(Comparator.comparing(PickerOption::getLabel, COLLATOR))
            .collect(Collectors.toList());
        return new PickerResultSet<>(options, true);
    }

    @Override
    public ScriptDirectoryDto getDirectory(int id) {
        return buildDirectoryDto(ao.get(ScriptDirectory.class, id));
    }

    @Override
    public ScriptDirectoryDto createDirectory(ApplicationUser user, ScriptDirectoryForm form) {
        validateDirectoryForm(form);

        return buildDirectoryDto(registryDao.createDirectory(user, form));
    }

    @Override
    public ScriptDirectoryDto updateDirectory(ApplicationUser user, int id, ScriptDirectoryForm form) {
        validateDirectoryForm(form);

        return buildDirectoryDto(registryDao.updateDirectory(user, id, form));
    }

    @Override
    public void deleteDirectory(ApplicationUser user, int id) {
        registryDao.deleteDirectory(user, id);
    }

    @Override
    public void restoreDirectory(ApplicationUser user, int id) {
        registryDao.restoreDirectory(user, id);
    }

    @Override
    public void moveDirectory(ApplicationUser user, int id, ParentForm form) {
        registryDao.moveDirectory(user, id, form);
    }

    @Override
    public List<ScriptDescription> getAllScriptDescriptions(WorkflowScriptType type) {
        Map<Integer, ScriptDirectoryDto> directories = getAllDirectories()
            .stream()
            .collect(Collectors.toMap(
                ScriptDirectoryDto::getId,
                Function.identity()
            ));

        return Arrays
            .stream(ao.find(Script.class, Query.select().where("DELETED = ?", Boolean.FALSE)))
            .map(script -> buildScriptDescription(directories, script))
            .filter(description -> description.getTypes().contains(type))
            .sorted(Comparator.comparing(ScriptDescription::getName, COLLATOR))
            .collect(Collectors.toList());
    }

    //todo: cache result, maybe add new method for workflow functions
    @Override
    public RegistryScriptDto getScript(int id, boolean includeChangelogs, boolean expandName, boolean includeErrorCount) {
        return buildScriptDto(ao.get(Script.class, id), includeChangelogs, expandName, true, includeErrorCount);
    }

    @Override
    public RegistryScriptDto createScript(ApplicationUser user, RegistryScriptForm scriptForm) {
        if (scriptForm.getDirectoryId() == null) {
            throw new RuntimeException();
        }

        ParseContext parseContext = validateScriptForm(true, scriptForm);
        String parameters = parseContext.getParameters().size() > 0 ? jsonMapper.write(parseContext.getParameters()) : null;

        return buildScriptDto(registryDao.createScript(user, scriptForm, parameters), true, false, true, true);
    }

    @Override
    public RegistryScriptDto updateScript(ApplicationUser user, int id, RegistryScriptForm scriptForm) {
        ParseContext parseContext = validateScriptForm(false, scriptForm);

        ClusterLock lock = clusterLockService.getLockForName(getLockKey(id));

        lock.lock();
        try {
            RegistryScriptDto result = doUpdateScript(user, id, scriptForm, parseContext);
            scriptInvalidationService.invalidate(String.valueOf(id));
            return result;
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void moveScript(ApplicationUser user, int id, ParentForm form) {
        registryDao.moveScript(user, id, form);
    }

    @Override
    public void deleteScript(ApplicationUser user, int id) {
        ClusterLock lock = clusterLockService.getLockForName(getLockKey(id));

        lock.lock();
        try {
            registryDao.deleteScript(user, id);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void restoreScript(ApplicationUser user, int id) {
        ClusterLock lock = clusterLockService.getLockForName(getLockKey(id));

        lock.lock();
        try {
            registryDao.restoreScript(user, id);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public List<ChangelogDto> getScriptChangelogs(int id) {
        RegistryScriptDto script = getScript(id, false, false, false);
        return changelogHelper.collect(script.getScriptBody(), ao.find(Changelog.class, Query.select().where("SCRIPT_ID = ?", id)));
    }

    private RegistryScriptDto doUpdateScript(ApplicationUser user, int id, RegistryScriptForm form, ParseContext parseContext) {
        String parameters = parseContext.getParameters().size() > 0 ? jsonMapper.write(parseContext.getParameters()) : null;

        return buildScriptDto(registryDao.updateScript(user, id, form, parameters), true, false, true, true);
    }

    private RegistryScriptDto buildScriptDto(Script script, boolean includeChangelogs, boolean expandName, boolean includeParentName, boolean includeErrorCount) {
        RegistryScriptDto result = new RegistryScriptDto();

        result.setId(script.getID());
        result.setUuid(script.getUuid());
        result.setDescription(script.getDescription());
        result.setDirectoryId(script.getDirectory().getID());
        result.setScriptBody(script.getScriptBody());
        result.setDeleted(script.isDeleted());

        if (includeParentName) {
            result.setParentName(ScriptUtil.getExpandedName(script.getDirectory()));
        }

        if (expandName) {
            result.setName(ScriptUtil.getExpandedName(script));
        } else {
            result.setName(script.getName());
        }

        if (includeChangelogs) {
            result.setChangelogs(changelogHelper.collect(script.getScriptBody(), script.getChangelogs()));
        }

        if (includeErrorCount) {
            if (script.getUuid() != null) {
                result.setErrorCount((long) executionRepository.getErrorCount(script.getUuid()));
                result.setWarningCount((long) executionRepository.getWarningCount(script.getUuid()));
            } else {
                result.setErrorCount((long) executionRepository.getErrorCount(script.getID()));
                result.setWarningCount((long) executionRepository.getWarningCount(script.getID()));
            }
        }

        if (script.getParameters() != null) {
            result.setParams(jsonMapper.read(script.getParameters(), Const.PARAM_LIST_TYPE_REF));
        }

        result.setTypes(parseTypes(script.getTypes()));

        return result;
    }

    private static Set<WorkflowScriptType> parseTypes(String types) {
        if (types == null) {
            return EnumSet.allOf(WorkflowScriptType.class);
        } else {
            return Arrays.stream(types.split(",")).map(WorkflowScriptType::valueOf).collect(Collectors.toSet());
        }
    }

    private static ScriptDirectoryDto buildDirectoryDto(ScriptDirectory directory) {
        ScriptDirectoryDto result = new ScriptDirectoryDto();

        result.setId(directory.getID());
        result.setName(directory.getName());
        result.setFullName(ScriptUtil.getExpandedName(directory));

        ScriptDirectory parent = directory.getParent();
        if (parent != null) {
            result.setParentId(parent.getID());
            result.setParentName(ScriptUtil.getExpandedName(directory.getParent()));
        }

        return result;
    }

    private void validateDirectoryForm(ScriptDirectoryForm form) {
        form.setName(StringUtils.trimToNull(form.getName()));

        if (StringUtils.isEmpty(form.getName())) {
            throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "name");
        }

        if (form.getName().length() > 32) {
            throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.valueTooLong"), "name");
        }
    }

    private ParseContext validateScriptForm(boolean isNew, RegistryScriptForm form) {
        if (isNew && (form.getDirectoryId() == null || form.getDirectoryId() <= 0)) {
            throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "directoryId");
        }

        ValidationUtils.validateForm(i18nHelper, isNew, form);

        if (StringUtils.isEmpty(form.getScriptBody())) {
            throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scriptBody");
        }
        ParseContext parseContext = scriptService.parseScript(form.getScriptBody());

        if (form.getTypes() == null || form.getTypes().size() == 0) {
            throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "types");
        }

        return parseContext;
    }

    private ScriptDescription buildScriptDescription(Map<Integer, ScriptDirectoryDto> allDirectories, Script script) {
        ScriptDescription result = new ScriptDescription();
        result.setId(script.getID());
        result.setName(ScriptUtil.getExpandedName(allDirectories, script));
        result.setDescription(script.getDescription());
        result.setTypes(parseTypes(script.getTypes()));

        if (script.getParameters() != null) {
            result.setParams(jsonMapper.read(script.getParameters(), Const.PARAM_LIST_TYPE_REF));
        }

        return result;
    }

    private static String getLockKey(int id) {
        return ScriptRepositoryImpl.class.toString() + "_script_" + id;
    }
}
