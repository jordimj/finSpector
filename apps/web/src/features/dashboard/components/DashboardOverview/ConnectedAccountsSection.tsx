import { CreditCard, PiggyBank, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { SummaryTile } from '../../../../components/SummaryTile';
import type { DashboardAccountSummary } from '../../hooks/useDashboardAccountSummaries';
import { getRevealStyle } from '../../../../utils/getRevealStyle';

type ConnectedAccountsSectionProps = {
  accountSummaries: DashboardAccountSummary[];
};

const accountIcons = {
  mine: <CreditCard className='size-5' aria-hidden='true' />,
  shared: <Users className='size-5' aria-hidden='true' />,
  kids: <PiggyBank className='size-5' aria-hidden='true' />,
} satisfies Record<DashboardAccountSummary['account'], ReactNode>;

export function ConnectedAccountsSection({
  accountSummaries,
}: ConnectedAccountsSectionProps) {
  return (
    <div className='mt-8'>
      <h2
        className='dashboard-reveal mb-4 text-xl font-semibold tracking-normal text-ink'
        style={getRevealStyle(280)}
      >
        Connected accounts
      </h2>
      <div className='grid gap-5 md:grid-cols-3'>
        {accountSummaries.map((account, index) => (
          <div
            key={account.label}
            className='dashboard-reveal'
            style={getRevealStyle(350 + index * 70)}
          >
            <SummaryTile
              badge={account.badge}
              detail={account.detail}
              footer={account.footer}
              icon={accountIcons[account.account]}
              label={account.label}
              tone={account.tone}
              value={account.value}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
