import React, { useState } from 'react';
import { X, Copy, Check, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EmailSetupBannerProps {
  userEmail: string;
  hasReceivedEmails: boolean;
}

const DISMISSED_KEY = 'email_setup_banner_dismissed';

function GmailInstructions({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-3 text-sm">
      <ol className="space-y-2 text-gray-700 list-decimal list-inside">
        <li>Open Gmail → click the <strong>Settings ⚙️</strong> icon → <strong>See all settings</strong></li>
        <li>Go to the <strong>Forwarding and POP/IMAP</strong> tab</li>
        <li>Click <strong>"Add a forwarding address"</strong> and paste your address below</li>
        <li>Google sends a confirmation code — click the link in that email</li>
        <li>
          <strong>Tip:</strong> Create a filter so only school emails get forwarded:
          Settings → Filters → "From: school name" → Forward to this address
        </li>
      </ol>
      <div className="flex items-center gap-2 mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="font-mono text-xs text-gray-700 flex-1 truncate">{address}</span>
        <button onClick={copy} className="text-blue-600 hover:text-blue-800 flex-shrink-0">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function OutlookInstructions({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-3 text-sm">
      <ol className="space-y-2 text-gray-700 list-decimal list-inside">
        <li>Open Outlook → click the <strong>Settings ⚙️</strong> icon → <strong>View all Outlook settings</strong></li>
        <li>Go to <strong>Mail → Forwarding</strong></li>
        <li>Enable <strong>"Enable forwarding"</strong> and paste your address below</li>
        <li>Click <strong>Save</strong></li>
        <li>
          <strong>Tip:</strong> Use Rules to forward only school emails:
          Settings → Rules → New rule → From [school] → Forward to this address
        </li>
      </ol>
      <div className="flex items-center gap-2 mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="font-mono text-xs text-gray-700 flex-1 truncate">{address}</span>
        <button onClick={copy} className="text-blue-600 hover:text-blue-800 flex-shrink-0">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function EmailSetupBanner({ userEmail, hasReceivedEmails }: EmailSetupBannerProps) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [copied, setCopied] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructionsTab, setInstructionsTab] = useState<'gmail' | 'outlook'>('gmail');

  const username = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const address = `calendar+${username}@inbound.powerparent.co.uk`;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInstructions = (provider: 'gmail' | 'outlook') => {
    setInstructionsTab(provider);
    setInstructionsOpen(true);
  };

  if (dismissed) return null;

  return (
    <>
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 relative">
        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-blue-300 hover:text-blue-500"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-blue-900">
            Get school email updates straight into your calendar
          </p>
        </div>

        <p className="text-xs text-blue-700 mb-3 leading-relaxed">
          Forward school emails to your personal address and we'll extract events automatically — nothing to type.
        </p>

        {/* Address row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 min-w-0">
            <span className="font-mono text-xs text-gray-700 truncate flex-1">{address}</span>
            <button
              onClick={copyAddress}
              className="flex-shrink-0 text-blue-600 hover:text-blue-800"
              aria-label="Copy address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Instruction links */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-blue-500">Set up in:</span>
          <button
            onClick={() => openInstructions('gmail')}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            Gmail
          </button>
          <button
            onClick={() => openInstructions('outlook')}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            Outlook
          </button>
        </div>
      </div>

      {/* Instructions modal */}
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              📧 Set up email forwarding
            </DialogTitle>
          </DialogHeader>

          {/* Tab toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setInstructionsTab('gmail')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                instructionsTab === 'gmail'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gmail
            </button>
            <button
              onClick={() => setInstructionsTab('outlook')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                instructionsTab === 'outlook'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Outlook
            </button>
          </div>

          {instructionsTab === 'gmail'
            ? <GmailInstructions address={address} />
            : <OutlookInstructions address={address} />
          }
        </DialogContent>
      </Dialog>
    </>
  );
}
