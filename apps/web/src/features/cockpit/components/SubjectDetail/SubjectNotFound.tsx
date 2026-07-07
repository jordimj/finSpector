import { BackLink } from './BackLink';
import { SubjectNotice } from './SubjectNotice';

export function SubjectNotFound() {
  return (
    <section className='mx-auto max-w-[1600px]'>
      <BackLink className='mb-5' />
      <SubjectNotice
        description='This cockpit subject is not configured.'
        title='Subject not found'
      />
    </section>
  );
}
