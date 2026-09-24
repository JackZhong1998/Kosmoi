import { CreateDesk } from '@/components/CreateDesk';

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreateDesk />
      {children}
    </>
  );
}
