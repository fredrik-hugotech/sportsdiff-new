import React, { type ReactNode } from 'react';

type PremiumAccessProps = {
  user: any;
  children?: ReactNode;
};

function PremiumAccess({ user, children }: PremiumAccessProps) {
  const hasAccess =
    user &&
    (import.meta.env.DEV || user.email?.endsWith('@sportsdiff.dev'));

  if (!hasAccess) {
    return <div className="p-4 text-center text-red-500">⛔ Du har ikke tilgang.</div>;
  }

  return <>{children}</>;
}

export default PremiumAccess;