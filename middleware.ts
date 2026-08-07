import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

// Login sayfası hariç tüm /admin/* rotalarını koru
export const config = {
  matcher: ["/admin/((?!login$).*)"],
};
