import { fileURLToPath } from 'url'
import { defineNuxtModule, addComponent, addAutoImport, addPlugin, createResolver, addVitePlugin } from '@nuxt/kit'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export type MonacoEditorLocale = 'de' | 'es' | 'fr' | 'it' | 'ja' | 'ko' | 'ru' | 'zh-cn' | 'zh-tw' | 'en';

export interface ModuleOptions {
  dest?: string,
  locale?: MonacoEditorLocale,
  componentName?: {
    codeEditor?: string,
    diffEditor?: string
  }
}

const DEFAULTS: ModuleOptions = {
  dest: '_monaco',
  locale: 'en',
  componentName: {
    codeEditor: 'MonacoEditor',
    diffEditor: 'MonacoDiffEditor'
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-monaco-editor',
    configKey: 'monacoEditor',
    compatibility: { nuxt: '^3.0.0' }
  },
  defaults: DEFAULTS,
  setup (options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    const { resolve: resolveURL } = createResolver(nuxt.options.app.baseURL)
    const { resolve } = createResolver(runtimeDir)
    const monacoEditorLocation = resolveURL(options.dest)
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('monaco-editor')
    nuxt.options.runtimeConfig.app.__MONACO_EDITOR_LOCALE__ = options.locale
    nuxt.options.runtimeConfig.app.__MONACO_EDITOR_LOCATION__ = monacoEditorLocation
    const [viteStaticCopyServePlugin, viteStaticCopyBuildPlugin] = viteStaticCopy({
      targets: [{
        src: require
          .resolve('monaco-editor/min/vs/loader.js')
          .replace(/\\/g, '/')
          .replace(/\/vs\/loader\.js$/, '/*'),
        dest: monacoEditorLocation.slice(1)
      }]
    })
    addVitePlugin(viteStaticCopyServePlugin)
    addVitePlugin(viteStaticCopyBuildPlugin)

    addPlugin(resolve('plugin.client'))
    addComponent({ name: options.componentName!.codeEditor!, filePath: resolve('MonacoEditor.vue') })
    addComponent({ name: options.componentName!.diffEditor!, filePath: resolve('MonacoDiffEditor.vue') })
    addAutoImport({ name: 'useMonaco', as: 'useMonaco', from: resolve('composables') })
  }
})
