import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/overview', 'architecture/data-model'],
    },
    {
      type: 'category',
      label: 'Decisions (ADRs)',
      items: [
        'decisions/adr-001-tech-stack',
        'decisions/adr-002-monorepo',
        'decisions/adr-003-auth',
        'decisions/adr-004-shared-data-model',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: ['development/getting-started', 'development/docker', 'development/dev-log', 'development/implementation-plan'],
    },
    'glossary',
  ],
}

export default sidebars
