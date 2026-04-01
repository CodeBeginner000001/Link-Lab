import NextAuth from "next-auth";
import {authOptions} from "@/lib/OAuth"


const handle = NextAuth(authOptions);

export { handle as GET, handle as POST };
