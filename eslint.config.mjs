import { base } from '@nyg/eslint-config'
import { nextWithTypescript } from '@nyg/eslint-config/next'
import { defineConfig } from 'eslint/config'

export default defineConfig([base, nextWithTypescript])
