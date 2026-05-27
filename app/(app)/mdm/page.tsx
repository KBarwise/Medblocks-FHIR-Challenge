import { MdmClient } from './mdm-client';
import { GitMerge } from 'lucide-react';

export default function MdmPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-medium mb-1 flex items-center gap-2">
        <GitMerge className="h-5 w-5 text-ink-500" />
        Patient Merge
      </h1>
      <p className="text-sm text-ink-500 mb-4">
        Scans the full patient database for likely duplicates and lets you merge them into a single record.
      </p>
      <MdmClient />
    </div>
  );
}
