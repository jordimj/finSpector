import { Header } from '../Header';
import { PreviewTable } from '../PreviewTable';
import { UploadPanel } from '../UploadPanel';
import { ImportAssistantStateProvider } from '../../hooks/useImportAssistantState';

export function ImportAssistant() {
  return (
    <ImportAssistantStateProvider>
      <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-[1600px] flex-col gap-3'>
        <Header />
        <UploadPanel />
        <PreviewTable />
      </section>
    </ImportAssistantStateProvider>
  );
}
