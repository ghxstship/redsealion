'use client';

interface OrgNode {
  name: string;
  title: string;
  children?: OrgNode[];
}

const mockOrg: OrgNode = {
  name: 'CEO',
  title: 'Chief Executive Officer',
  children: [
    {
      name: 'VP Operations',
      title: 'VP of Operations',
      children: [
        { name: 'Project Manager 1', title: 'Senior PM' },
        { name: 'Project Manager 2', title: 'PM' },
      ],
    },
    {
      name: 'Creative Director',
      title: 'Creative Director',
      children: [
        { name: 'Lead Designer', title: 'Senior Designer' },
        { name: 'Designer 2', title: 'Designer' },
      ],
    },
    {
      name: 'Head of Production',
      title: 'Production Lead',
      children: [
        { name: 'Fabricator 1', title: 'Senior Fabricator' },
        { name: 'Installer 1', title: 'Lead Installer' },
      ],
    },
  ],
};

function OrgNode({ node, isRoot = false }: { node: OrgNode; isRoot?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-xl border border-border bg-white px-5 py-3 text-center ${isRoot ? 'shadow-md' : ''}`}>
        <p className="text-sm font-medium text-foreground">{node.name}</p>
        <p className="text-xs text-text-secondary">{node.title}</p>
      </div>

      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-8 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{
                width: `calc(100% - 80px)`,
              }} />
            )}
            {node.children.map((child) => (
              <div key={child.name} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChart() {
  return (
    <div className="rounded-xl border border-border bg-white px-8 py-8 overflow-x-auto">
      <div className="min-w-[600px] flex justify-center">
        <OrgNode node={mockOrg} isRoot />
      </div>
    </div>
  );
}
