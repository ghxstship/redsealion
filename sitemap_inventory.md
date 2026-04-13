# Site Map & Workflow Inventory

```
Platform / App Name: Red Sea Lion - Internal App
└── Section (Layout): Root
    ├── Identity: { path: '/app' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 20
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: Root
    ├── Identity: { path: '/app' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/clients/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/clients/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: activity
    ├── Identity: { path: '/app/clients/(hub)/activity' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: map
    ├── Identity: { path: '/app/clients/(hub)/map' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: segments
    ├── Identity: { path: '/app/clients/(hub)/segments' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/clients/[id]' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 13
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): settings
    ├── Identity: { path: '/app/settings' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: ["Guarded by RoleGate: ['']"]
└── Page: settings
    ├── Identity: { path: '/app/settings' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/general', '/api/settings/general']"]
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: payments
    ├── Identity: { path: '/app/settings/payments' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/general', '/api/settings/payment-terms']"]
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: branding
    ├── Identity: { path: '/app/settings/branding' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/general', '/api/settings/branding']"]
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: security
    ├── Identity: { path: '/app/settings/security' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: audit-log
    ├── Identity: { path: '/app/settings/security/audit-log' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: mfa
    ├── Identity: { path: '/app/settings/security/mfa' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: permissions
    ├── Identity: { path: '/app/settings/security/permissions' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: email-templates
    ├── Identity: { path: '/app/settings/email-templates' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/email-templates', '/api/settings/email-templates', '/api/settings/email-templates']"]
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: appearance
    ├── Identity: { path: '/app/settings/appearance' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: data-privacy
    ├── Identity: { path: '/app/settings/data-privacy' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/data-export']", 'Navigation trigger']
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: tax
    ├── Identity: { path: '/app/settings/tax' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/general', '/api/settings/tax']"]
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: api-keys
    ├── Identity: { path: '/app/settings/api-keys' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/api-keys', '/api/settings/api-keys', '/api/settings/api-keys']", 'Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: audit-log
    ├── Identity: { path: '/app/settings/audit-log' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: tags
    ├── Identity: { path: '/app/settings/tags' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/tags', '/api/settings/tags', '/api/settings/tags']"]
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: calendar-sync
    ├── Identity: { path: '/app/settings/calendar-sync' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/calendar/feed', '/api/settings/calendar-sync', '/api/settings/calendar-sync']"]
    ├── Dependencies count: 6
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: integrations
    ├── Identity: { path: '/app/settings/integrations' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: []
└── Page: sso
    ├── Identity: { path: '/app/settings/sso' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: document-defaults
    ├── Identity: { path: '/app/settings/document-defaults' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/document-defaults', '/api/settings/document-defaults']"]
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: profile
    ├── Identity: { path: '/app/settings/profile' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/profile', '/api/settings/profile']"]
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: team
    ├── Identity: { path: '/app/settings/team' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: payment-terms
    ├── Identity: { path: '/app/settings/payment-terms' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/general', '/api/settings/payment-terms']"]
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: cost-rates
    ├── Identity: { path: '/app/settings/cost-rates' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: custom-fields
    ├── Identity: { path: '/app/settings/custom-fields' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: webhooks
    ├── Identity: { path: '/app/settings/webhooks' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/webhooks/endpoints', '/api/webhooks/endpoints/']"]
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: notifications
    ├── Identity: { path: '/app/settings/notifications' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/notifications/preferences']"]
    ├── Dependencies count: 4
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: facilities
    ├── Identity: { path: '/app/settings/facilities' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: billing
    ├── Identity: { path: '/app/settings/billing' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Page: automations-config
    ├── Identity: { path: '/app/settings/automations-config' }
    ├── Capabilities: ['Client-side interactivity', 'Form Submission (CRUD)']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: localization
    ├── Identity: { path: '/app/settings/localization' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/settings/localization', '/api/settings/localization']"]
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/rentals/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ["Guarded by RoleGate: ['']"]
└── Page: hub
    ├── Identity: { path: '/app/rentals/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: sub-rentals
    ├── Identity: { path: '/app/rentals/(hub)/sub-rentals' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: reservations
    ├── Identity: { path: '/app/rentals/(hub)/reservations' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: utilization
    ├── Identity: { path: '/app/rentals/(hub)/utilization' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: returns
    ├── Identity: { path: '/app/rentals/(hub)/returns' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/rentals/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/clients', '/api/events', '/api/rentals/orders']"]
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/rentals/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/pipeline/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/pipeline/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: forecast
    ├── Identity: { path: '/app/pipeline/(hub)/forecast' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: commissions
    ├── Identity: { path: '/app/pipeline/(hub)/commissions' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: settings
    ├── Identity: { path: '/app/pipeline/(hub)/settings' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: ["Guarded by RoleGate: ['', '']"]
└── Page: territories
    ├── Identity: { path: '/app/pipeline/(hub)/territories' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: list
    ├── Identity: { path: '/app/pipeline/(hub)/list' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/pipeline/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 19
    └── RBAC: []
└── Section (Layout): schedule
    ├── Identity: { path: '/app/schedule' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/schedule/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: run-of-show
    ├── Identity: { path: '/app/schedule/(hub)/run-of-show' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: milestones
    ├── Identity: { path: '/app/schedule/(hub)/milestones' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: build-strike
    ├── Identity: { path: '/app/schedule/(hub)/build-strike' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/schedule/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/events', '/api/production-schedules']"]
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/schedule/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Section (Layout): work-orders
    ├── Identity: { path: '/app/work-orders' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: work-orders
    ├── Identity: { path: '/app/work-orders' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/work-orders/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/work-orders']", 'Navigation trigger']
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/work-orders/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Section (Layout): tasks
    ├── Identity: { path: '/app/tasks' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/tasks/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: calendar
    ├── Identity: { path: '/app/tasks/(hub)/calendar' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: board
    ├── Identity: { path: '/app/tasks/(hub)/board' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: projects
    ├── Identity: { path: '/app/tasks/(hub)/projects' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: gantt
    ├── Identity: { path: '/app/tasks/(hub)/gantt' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: workload
    ├── Identity: { path: '/app/tasks/(hub)/workload' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/tasks/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 19
    └── RBAC: []
└── Section (Layout): my-tasks
    ├── Identity: { path: '/app/my-tasks' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: my-tasks
    ├── Identity: { path: '/app/my-tasks' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: portal
    ├── Identity: { path: '/app/portal' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/portal/projects/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Section (Layout): my-inbox
    ├── Identity: { path: '/app/my-inbox' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: my-inbox
    ├── Identity: { path: '/app/my-inbox' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: calendar
    ├── Identity: { path: '/app/calendar' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 11
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): my-documents
    ├── Identity: { path: '/app/my-documents' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: my-documents
    ├── Identity: { path: '/app/my-documents' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/invoices/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/invoices/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: credit-notes
    ├── Identity: { path: '/app/invoices/(hub)/credit-notes' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: recurring
    ├── Identity: { path: '/app/invoices/(hub)/recurring' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/invoices/new' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/invoices/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Section (Layout): goals
    ├── Identity: { path: '/app/goals' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: goals
    ├── Identity: { path: '/app/goals' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Section (Layout): profitability
    ├── Identity: { path: '/app/profitability' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: profitability
    ├── Identity: { path: '/app/profitability' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: [proposalId]
    ├── Identity: { path: '/app/profitability/[proposalId]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 9
    └── RBAC: []
└── Section (Layout): roadmap
    ├── Identity: { path: '/app/roadmap' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: roadmap
    ├── Identity: { path: '/app/roadmap' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Section (Layout): expenses
    ├── Identity: { path: '/app/expenses' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/expenses/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/expenses/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: receipts
    ├── Identity: { path: '/app/expenses/(hub)/receipts' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: approvals
    ├── Identity: { path: '/app/expenses/(hub)/approvals' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: mileage
    ├── Identity: { path: '/app/expenses/(hub)/mileage' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/expenses/new' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/expenses/mileage/new' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/leads/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/leads/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: forms
    ├── Identity: { path: '/app/leads/(hub)/forms' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/leads/(hub)/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): dispatch
    ├── Identity: { path: '/app/dispatch' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/dispatch/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/dispatch/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 14
    └── RBAC: []
└── Page: board
    ├── Identity: { path: '/app/dispatch/(hub)/board' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: history
    ├── Identity: { path: '/app/dispatch/(hub)/history' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: routes
    ├── Identity: { path: '/app/dispatch/(hub)/routes' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/dispatch/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/crew', '/api/events', '/api/proposals', '/api/work-orders']", 'Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/dispatch/[id]' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/work-orders/', '/api/work-orders/', '/api/work-orders/', '/api/work-orders/', '/api/work-orders/', '/api/work-orders/', '/api/work-orders/', '/api/crew/']", 'Navigation trigger']
    ├── Dependencies count: 17
    └── RBAC: []
└── Section (Layout): projects
    ├── Identity: { path: '/app/projects' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: projects
    ├── Identity: { path: '/app/projects' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/projects/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/projects']", 'Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/projects/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Section (Layout): favorites
    ├── Identity: { path: '/app/favorites' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: favorites
    ├── Identity: { path: '/app/favorites' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): emails
    ├── Identity: { path: '/app/emails' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: emails
    ├── Identity: { path: '/app/emails' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: []
└── Page: templates
    ├── Identity: { path: '/app/emails/templates' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: []
    ├── Dependencies count: 14
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/emails/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Section (Layout): marketplace
    ├── Identity: { path: '/app/marketplace' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: marketplace
    ├── Identity: { path: '/app/marketplace' }
    ├── Capabilities: ['Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 13
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/marketplace/[id]' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/work-orders/', '/api/work-orders/', '/api/work-orders/', '/api/work-orders/']", 'Navigation trigger']
    ├── Dependencies count: 13
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): terms
    ├── Identity: { path: '/app/terms' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: terms
    ├── Identity: { path: '/app/terms' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): crew
    ├── Identity: { path: '/app/crew' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/crew/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/crew/(hub)' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/crew/', '/api/crew/', '/api/crew']", 'Navigation trigger']
    ├── Dependencies count: 25
    └── RBAC: []
└── Page: schedule
    ├── Identity: { path: '/app/crew/(hub)/schedule' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: recruitment
    ├── Identity: { path: '/app/crew/(hub)/recruitment' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: availability
    ├── Identity: { path: '/app/crew/(hub)/availability' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: onboarding
    ├── Identity: { path: '/app/crew/(hub)/onboarding' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/crew/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 15
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: edit
    ├── Identity: { path: '/app/crew/[id]/edit' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/crew/']"]
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): advancing
    ├── Identity: { path: '/app/advancing' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/advancing/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: assignments
    ├── Identity: { path: '/app/advancing/(hub)/assignments' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: fulfillment
    ├── Identity: { path: '/app/advancing/(hub)/fulfillment' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: allocations
    ├── Identity: { path: '/app/advancing/(hub)/allocations' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: submissions
    ├── Identity: { path: '/app/advancing/(hub)/submissions' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: approvals
    ├── Identity: { path: '/app/advancing/(hub)/approvals' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/advancing/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Section (Layout): compliance
    ├── Identity: { path: '/app/compliance' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/compliance/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/compliance/export']", 'Navigation trigger']
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: licenses
    ├── Identity: { path: '/app/compliance/(hub)/licenses' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: permits
    ├── Identity: { path: '/app/compliance/(hub)/permits' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: contracts
    ├── Identity: { path: '/app/compliance/(hub)/contracts' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: cois
    ├── Identity: { path: '/app/compliance/(hub)/cois' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: certifications
    ├── Identity: { path: '/app/compliance/(hub)/certifications' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/time/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/time/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: timesheets
    ├── Identity: { path: '/app/time/(hub)/timesheets' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: timer
    ├── Identity: { path: '/app/time/(hub)/timer' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): workloads
    ├── Identity: { path: '/app/workloads' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/workloads/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: schedule
    ├── Identity: { path: '/app/workloads/(hub)/schedule' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: utilization
    ├── Identity: { path: '/app/workloads/(hub)/utilization' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Section (Layout): integrations
    ├── Identity: { path: '/app/integrations' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: integrations
    ├── Identity: { path: '/app/integrations' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: sync-errors
    ├── Identity: { path: '/app/integrations/sync-errors' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: [platform]
    ├── Identity: { path: '/app/integrations/[platform]' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/integrations/', '/api/integrations/', '/api/integrations/', '/api/integrations/', '/api/integrations/', '/api/integrations/']", 'Navigation trigger']
    ├── Dependencies count: 11
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/fabrication/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/fabrication/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: bom
    ├── Identity: { path: '/app/fabrication/(hub)/bom' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: quality
    ├── Identity: { path: '/app/fabrication/(hub)/quality' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: shop-floor
    ├── Identity: { path: '/app/fabrication/(hub)/shop-floor' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: kiosk
    ├── Identity: { path: '/app/fabrication/(hub)/shop-floor/kiosk' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: print
    ├── Identity: { path: '/app/fabrication/(hub)/print' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/fabrication/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Section (Layout): my-schedule
    ├── Identity: { path: '/app/my-schedule' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: my-schedule
    ├── Identity: { path: '/app/my-schedule' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/procurement/purchase-orders/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/procurement/suppliers/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/vendors']", 'Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/procurement/suppliers/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/procurement/requisitions/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/purchase-requisitions', '/api/purchase-requisitions/']", 'Navigation trigger']
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/procurement/requisitions/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/procurement/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ["Guarded by RoleGate: ['']"]
└── Page: hub
    ├── Identity: { path: '/app/procurement/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: purchase-orders
    ├── Identity: { path: '/app/procurement/(hub)/purchase-orders' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: suppliers
    ├── Identity: { path: '/app/procurement/(hub)/suppliers' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: requisitions
    ├── Identity: { path: '/app/procurement/(hub)/requisitions' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: receiving
    ├── Identity: { path: '/app/procurement/(hub)/receiving' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/procurement/receiving/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/purchase-orders', '/api/purchase-orders', '/api/goods-receipts']", 'Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/procurement/receiving/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: ai
    ├── Identity: { path: '/app/ai' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): locations
    ├── Identity: { path: '/app/locations' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: locations
    ├── Identity: { path: '/app/locations' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/locations/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Section (Layout): budgets
    ├── Identity: { path: '/app/budgets' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: budgets
    ├── Identity: { path: '/app/budgets' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 9
    └── RBAC: ["Guarded by RoleGate: ['']"]
└── Page: [id]
    ├── Identity: { path: '/app/budgets/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/people/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/people/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: time-off
    ├── Identity: { path: '/app/people/(hub)/time-off' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: org-chart
    ├── Identity: { path: '/app/people/(hub)/org-chart' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/people/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Section (Layout): portfolio
    ├── Identity: { path: '/app/portfolio' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: portfolio
    ├── Identity: { path: '/app/portfolio' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/portfolio/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): files
    ├── Identity: { path: '/app/files' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: files
    ├── Identity: { path: '/app/files' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Section (Layout): templates
    ├── Identity: { path: '/app/templates' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: templates
    ├── Identity: { path: '/app/templates' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/templates/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): finance
    ├── Identity: { path: '/app/finance' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: new
    ├── Identity: { path: '/app/finance/vendors/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/vendors']", 'Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/finance/vendors/[id]' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/vendors/', '/api/vendors/', '/api/vendors/']", 'Navigation trigger']
    ├── Dependencies count: 14
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: new
    ├── Identity: { path: '/app/finance/purchase-orders/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/vendors', '/api/proposals', '/api/purchase-orders']", 'Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/finance/purchase-orders/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: hub
    ├── Identity: { path: '/app/finance/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: vendors
    ├── Identity: { path: '/app/finance/(hub)/vendors' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: purchase-orders
    ├── Identity: { path: '/app/finance/(hub)/purchase-orders' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: invoices
    ├── Identity: { path: '/app/finance/(hub)/invoices' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: credit-notes
    ├── Identity: { path: '/app/finance/(hub)/invoices/credit-notes' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: recurring
    ├── Identity: { path: '/app/finance/(hub)/invoices/recurring' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: profitability
    ├── Identity: { path: '/app/finance/(hub)/profitability' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: budgets
    ├── Identity: { path: '/app/finance/(hub)/budgets' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: revenue-recognition
    ├── Identity: { path: '/app/finance/(hub)/revenue-recognition' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/automations/(hub)' }
    ├── Capabilities: []
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 4
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/automations/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: templates
    ├── Identity: { path: '/app/automations/(hub)/templates' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: runs
    ├── Identity: { path: '/app/automations/(hub)/runs' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/automations/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/automations']", 'Navigation trigger']
    ├── Dependencies count: 13
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/automations/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: edit
    ├── Identity: { path: '/app/automations/[id]/edit' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/automations/', '/api/automations/', '/api/automations/']", 'Navigation trigger']
    ├── Dependencies count: 15
    └── RBAC: []
└── Section (Layout): hub
    ├── Identity: { path: '/app/campaigns/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ["Guarded by RoleGate: ['']"]
└── Page: hub
    ├── Identity: { path: '/app/campaigns/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: audiences
    ├── Identity: { path: '/app/campaigns/(hub)/audiences' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: drafts
    ├── Identity: { path: '/app/campaigns/(hub)/drafts' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: scheduled
    ├── Identity: { path: '/app/campaigns/(hub)/scheduled' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: analytics
    ├── Identity: { path: '/app/campaigns/(hub)/analytics' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/campaigns/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/campaigns']"]
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): events
    ├── Identity: { path: '/app/events' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/events/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/events/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: activations
    ├── Identity: { path: '/app/events/(hub)/activations' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: calendar
    ├── Identity: { path: '/app/events/(hub)/calendar' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: locations
    ├── Identity: { path: '/app/events/(hub)/locations' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: daily-reports
    ├── Identity: { path: '/app/events/(hub)/daily-reports' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: punch-list
    ├── Identity: { path: '/app/events/(hub)/punch-list' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/events/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 10
    └── RBAC: []
└── Section (Layout): assets
    ├── Identity: { path: '/app/assets' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: assets
    ├── Identity: { path: '/app/assets' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/assets/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): equipment
    ├── Identity: { path: '/app/equipment' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/equipment/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/equipment/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: inventory
    ├── Identity: { path: '/app/equipment/(hub)/inventory' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: check-in-out
    ├── Identity: { path: '/app/equipment/(hub)/check-in-out' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: maintenance
    ├── Identity: { path: '/app/equipment/(hub)/maintenance' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: assets
    ├── Identity: { path: '/app/equipment/(hub)/assets' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: bundles
    ├── Identity: { path: '/app/equipment/(hub)/bundles' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/equipment/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): logistics
    ├── Identity: { path: '/app/logistics' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/logistics/shipments/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: bol
    ├── Identity: { path: '/app/logistics/shipments/[id]/bol' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/logistics/(hub)' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/logistics/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: transfers
    ├── Identity: { path: '/app/logistics/(hub)/transfers' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: shipping
    ├── Identity: { path: '/app/logistics/(hub)/shipping' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 12
    └── RBAC: []
└── Page: scan
    ├── Identity: { path: '/app/logistics/(hub)/scan' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: receiving
    ├── Identity: { path: '/app/logistics/(hub)/receiving' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 12
    └── RBAC: []
└── Page: goods-receipts
    ├── Identity: { path: '/app/logistics/(hub)/goods-receipts' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: counts
    ├── Identity: { path: '/app/logistics/(hub)/counts' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: ['Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: packing
    ├── Identity: { path: '/app/logistics/(hub)/packing' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/app/logistics/transfers/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/logistics/counts/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): proposals
    ├── Identity: { path: '/app/proposals' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: proposals
    ├── Identity: { path: '/app/proposals' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: new
    ├── Identity: { path: '/app/proposals/new' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/proposals']"]
    ├── Dependencies count: 14
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: [id]
    ├── Identity: { path: '/app/proposals/[id]' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: ["Calls API endpoint: ['/api/proposals/', '/api/proposals/']", 'Navigation trigger']
    ├── Dependencies count: 16
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: scenarios
    ├── Identity: { path: '/app/proposals/[id]/scenarios' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: export
    ├── Identity: { path: '/app/proposals/[id]/export' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: []
└── Page: builder
    ├── Identity: { path: '/app/proposals/[id]/builder' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 14
    └── RBAC: ['Guarded by RoleGate: []']
└── Section (Layout): hub
    ├── Identity: { path: '/app/reports/(hub)' }
    ├── Capabilities: ['Client-side interactivity']
    ├── Workflows: []
    ├── Dependencies count: 1
    └── RBAC: ['Guarded by RoleGate: []']
└── Page: hub
    ├── Identity: { path: '/app/reports/(hub)' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: forecast
    ├── Identity: { path: '/app/reports/(hub)/forecast' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: pipeline
    ├── Identity: { path: '/app/reports/(hub)/pipeline' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: utilization
    ├── Identity: { path: '/app/reports/(hub)/utilization' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: revenue
    ├── Identity: { path: '/app/reports/(hub)/revenue' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
└── Page: wip
    ├── Identity: { path: '/app/reports/(hub)/wip' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: builder
    ├── Identity: { path: '/app/reports/(hub)/builder' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: []
    ├── Dependencies count: 13
    └── RBAC: []
└── Page: funnel
    ├── Identity: { path: '/app/reports/(hub)/funnel' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 11
    └── RBAC: []
└── Page: win-rate
    ├── Identity: { path: '/app/reports/(hub)/win-rate' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 10
    └── RBAC: []
Platform / App Name: Red Sea Lion - External Portal
└── Section (Layout): [orgSlug]
    ├── Identity: { path: '/portal/[orgSlug]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: [orgSlug]
    ├── Identity: { path: '/portal/[orgSlug]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Section (Layout): contractor
    ├── Identity: { path: '/portal/[orgSlug]/contractor' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: contractor
    ├── Identity: { path: '/portal/[orgSlug]/contractor' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: bookings
    ├── Identity: { path: '/portal/[orgSlug]/contractor/bookings' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/portal/[orgSlug]/contractor/bookings/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: compliance
    ├── Identity: { path: '/portal/[orgSlug]/contractor/compliance' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: time
    ├── Identity: { path: '/portal/[orgSlug]/contractor/time' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/portal/contractor/time-entries', '/api/portal/contractor/time-entries']"]
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: profile
    ├── Identity: { path: '/portal/[orgSlug]/contractor/profile' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: []
    ├── Dependencies count: 9
    └── RBAC: []
└── Page: documents
    ├── Identity: { path: '/portal/[orgSlug]/contractor/documents' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: jobs
    ├── Identity: { path: '/portal/[orgSlug]/contractor/jobs' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/portal/[orgSlug]/contractor/jobs/[id]' }
    ├── Capabilities: ['Client-side interactivity', 'Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: ["Calls API endpoint: ['/api/work-orders/', '/api/work-orders/', '/api/work-orders/']", 'Navigation trigger']
    ├── Dependencies count: 12
    └── RBAC: []
└── Section (Layout): Root
    ├── Identity: { path: '/portal/[orgSlug]/app' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: Root
    ├── Identity: { path: '/portal/[orgSlug]/app' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: clients
    ├── Identity: { path: '/portal/[orgSlug]/app/clients' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: pipeline
    ├── Identity: { path: '/portal/[orgSlug]/app/pipeline' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 7
    └── RBAC: []
└── Page: invoices
    ├── Identity: { path: '/portal/[orgSlug]/app/invoices' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: leads
    ├── Identity: { path: '/portal/[orgSlug]/app/leads' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: [...rest]
    ├── Identity: { path: '/portal/[orgSlug]/app/[...rest]' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Page: proposals
    ├── Identity: { path: '/portal/[orgSlug]/app/proposals' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: reports
    ├── Identity: { path: '/portal/[orgSlug]/app/reports' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 2
    └── RBAC: []
└── Page: [bookingId]
    ├── Identity: { path: '/portal/[orgSlug]/bookings/[bookingId]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: refer
    ├── Identity: { path: '/portal/[orgSlug]/refer' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: [invoiceId]
    ├── Identity: { path: '/portal/[orgSlug]/pay/[invoiceId]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Page: request
    ├── Identity: { path: '/portal/[orgSlug]/request' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: account
    ├── Identity: { path: '/portal/[orgSlug]/account' }
    ├── Capabilities: ['Data fetching', 'Form Submission (CRUD)']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: [token]
    ├── Identity: { path: '/portal/[orgSlug]/sign/[token]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Page: pricing
    ├── Identity: { path: '/portal/[orgSlug]/pricing' }
    ├── Capabilities: []
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
└── Page: login
    ├── Identity: { path: '/portal/[orgSlug]/login' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 3
    └── RBAC: []
└── Section (Layout): [id]
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: [id]
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: comments
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]/comments' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: progress
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]/progress' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 6
    └── RBAC: []
└── Page: invoices
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]/invoices' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 5
    └── RBAC: []
└── Page: milestones
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]/milestones' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 8
    └── RBAC: []
└── Page: files
    ├── Identity: { path: '/portal/[orgSlug]/proposals/[id]/files' }
    ├── Capabilities: ['Data fetching']
    ├── Workflows: []
    ├── Dependencies count: 4
    └── RBAC: []
```

## Quality Flags

### Orphaned Elements
- None detected

### Dead-End Workflows
- Page /app has no obvious actions or links out
- Page /app/clients/[id] has no obvious actions or links out
- Page /app/settings/security has no obvious actions or links out
- Page /app/settings/integrations has no obvious actions or links out
- Page /app/settings/billing has no obvious actions or links out
- Page /app/tasks/(hub)/board has no obvious actions or links out
- Page /app/tasks/(hub)/gantt has no obvious actions or links out
- Page /app/expenses/(hub)/receipts has no obvious actions or links out
- Page /app/expenses/new has no obvious actions or links out
- Page /app/expenses/mileage/new has no obvious actions or links out
- Page /app/compliance/(hub)/licenses has no obvious actions or links out
- Page /app/compliance/(hub)/permits has no obvious actions or links out
- Page /app/compliance/(hub)/contracts has no obvious actions or links out
- Page /app/compliance/(hub)/cois has no obvious actions or links out
- Page /app/compliance/(hub)/certifications has no obvious actions or links out
- Page /app/time/(hub)/timer has no obvious actions or links out
- Page /app/procurement/(hub)/receiving has no obvious actions or links out
- Page /app/ai has no obvious actions or links out
- Page /app/locations has no obvious actions or links out
- Page /app/people/(hub)/org-chart has no obvious actions or links out
- ...and 6 more

### Permission Gaps
- Page /app has no explicit RoleGate
- Page /app/clients/(hub)/activity has no explicit RoleGate
- Page /app/clients/(hub)/map has no explicit RoleGate
- Page /app/clients/(hub)/segments has no explicit RoleGate
- Page /app/settings/security has no explicit RoleGate
- Page /app/settings/security/audit-log has no explicit RoleGate
- Page /app/settings/security/permissions has no explicit RoleGate
- Page /app/settings/audit-log has no explicit RoleGate
- Page /app/settings/integrations has no explicit RoleGate
- Page /app/settings/sso has no explicit RoleGate
- Page /app/settings/cost-rates has no explicit RoleGate
- Page /app/settings/custom-fields has no explicit RoleGate
- Page /app/settings/webhooks has no explicit RoleGate
- Page /app/settings/billing has no explicit RoleGate
- Page /app/rentals/(hub) has no explicit RoleGate
- Page /app/rentals/(hub)/sub-rentals has no explicit RoleGate
- Page /app/rentals/(hub)/reservations has no explicit RoleGate
- Page /app/rentals/(hub)/utilization has no explicit RoleGate
- Page /app/rentals/(hub)/returns has no explicit RoleGate
- Page /app/rentals/new has no explicit RoleGate
- ...and 145 more

### Dangling Dependencies
- None detected

