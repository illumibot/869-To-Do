import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;

  if (url.pathname.startsWith('/admin')) {
    const password = url.searchParams.get('password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
