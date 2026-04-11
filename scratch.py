import os

def walk(dir):
    results = []
    for root, dirs, files in os.walk(dir):
        for file in files:
            if file == 'loading.tsx':
                results.append(os.path.join(root, file))
    return results

files = walk('./src/app')

replacement = """import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <Skeleton height="h-32" />
      <Skeleton height="h-[600px]" />
    </div>
  );
}
"""

count = 0
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'animate-pulse' in content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(replacement)
        print(f"Replaced {file}")
        count += 1

print(f"Replaced {count} files.")
