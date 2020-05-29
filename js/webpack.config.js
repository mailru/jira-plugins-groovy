const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WrmPlugin = require('atlassian-webresource-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const OUTPUT_DIR = '../src/main/resources/';

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return ({
        entry: {
            main: ['./src/app-main/index.tsx'],
            workflow: ['./src/app-workflow/index.tsx'],
            'editor-worker': ['./node_modules/monaco-editor/esm/vs/editor/editor.worker.js']
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            alias: {
                lodash: 'lodash-es'
            }
        },
        output: {
            path: path.resolve(OUTPUT_DIR),
            filename: 'ru/mail/jira/plugins/groovy/js/[name].js',
            chunkFilename: 'ru/mail/jira/plugins/groovy/js/[name].chunk.js',
            jsonpFunction: 'mailruGroovyWebpackJsonp',
            sourceMapFilename: '[file].smap',
            globalObject: 'self'
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: true
                }),
                new OptimizeCSSAssetsPlugin({})
            ],
            splitChunks: {
                cacheGroups: {
                    commons: {
                        name: 'commons',
                        chunks: chunk => chunk === 'main' || chunk === 'workflow',
                        minChunks: 2
                    }
                }
            }
        },
        plugins: [
            //new BundleAnalyzerPlugin(),
            new MiniCssExtractPlugin({
                filename: 'ru/mail/jira/plugins/groovy/css/[name].css',
                chunkFilename: 'ru/mail/jira/plugins/groovy/css/[name].chunk.css'
            }),
            new WrmPlugin({
                pluginKey: 'ru.mail.jira.plugins.groovy',
                amdProvider: 'jira.webresources:almond',
                xmlDescriptors: path.resolve(OUTPUT_DIR, 'META-INF', 'plugin-descriptors', 'wr-defs.xml'),
                contextMap: {
                    main: ['ru.mail.jira.plugins.groovy.main'],
                    workflow: ['ru.mail.jira.plugins.groovy.workflow'],
                },
                providedDependencies: {
                    'jquery': {
                        dependency: 'com.atlassian.plugins.jquery:jquery',
                        import: {
                            var: 'AJS.$'
                        }
                    },
                    'AJS': {
                        dependency: 'com.atlassian.auiplugin:aui-core',
                        import: {
                            var: 'AJS'
                        }
                    },
                    'external-i18n': {
                        dependency: 'ru.mail.jira.plugins.groovy:react-i18n',
                        import: {
                            var: 'require(\'mailru/groovy/i18n-react\')'
                        }
                    }
                }
            })
        ],
        externals: {
            extDefine: 'define',
        },
        module: {
            rules: [
                {
                    test: [/\.ts$/, /\.tsx$/],
                    exclude: /node_modules/,
                    enforce: 'pre',
                    loader: 'eslint-loader'
                },
                {
                    oneOf: [
                        {
                            test: [/\.js$/, /\.ts$/, /\.tsx$/],
                            exclude: /node_modules/,
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    [
                                        require('@babel/preset-react'),
                                        {
                                            useBuiltIns: true,
                                        }
                                    ],
                                    [
                                        require('@babel/preset-typescript'),
                                        {
                                            allExtensions: false
                                        }
                                    ],
                                    [
                                        require('@babel/preset-env'),
                                        {
                                            //based on https://confluence.atlassian.com/adminjiraserver073/supported-platforms-861253018.html
                                            targets: {
                                                chrome: '69',
                                                ie: '11',
                                                edge: '42',
                                                firefox: '62',
                                                safari: '12'
                                            },
                                            ignoreBrowserslistConfig: true,
                                            corejs: 3,
                                            modules: false,
                                            useBuiltIns: 'usage'
                                        },
                                    ],
                                ],
                                plugins: [
                                    'emotion',
                                    require('@babel/plugin-transform-destructuring'),
                                    [
                                        require('@babel/plugin-proposal-class-properties'),
                                        {
                                            loose: true,
                                        }
                                    ],
                                    [
                                        require('@babel/plugin-proposal-object-rest-spread'),
                                        {
                                            useBuiltIns: true,
                                        }
                                    ]
                                ].filter(it => it)
                            }
                        },
                        {
                            test: [/\.less$/, /\.css$/],
                            use: [
                                isProduction
                                    ? {
                                        loader: MiniCssExtractPlugin.loader,
                                        options: {
                                            esModule: true
                                        }
                                    }
                                    : 'style-loader',
                                {
                                    loader: 'css-loader',
                                    options: {
                                        esModule: true
                                    }
                                },
                                {
                                    loader: 'less-loader',
                                    options: {
                                        lessOptions: {
                                            noIeCompat: false
                                        }
                                    }
                                }
                            ],
                            sideEffects: true
                        },
                        {
                            test: /\.wasm$/,
                            loader: 'file-loader',
                            type: 'javascript/auto',
                            options: {
                                name: 'ru/mail/jira/plugins/groovy/media/[name].[hash:8].[ext]',
                            },
                        },
                        {
                            loader: require.resolve('file-loader'),
                            exclude: [/\.js$/, /\.ts$/, /\.tsx$/, /\.html$/, /\.json$/],
                            options: {
                                name: 'ru/mail/jira/plugins/groovy/media/[name].[hash:8].[ext]',
                            },
                        },
                    ]
                }
            ]
        }
    });
};
