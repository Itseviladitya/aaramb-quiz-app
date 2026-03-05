import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { connectMongoose } from "@/lib/mongoose";
import User from "../../server/models/User";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      await connectMongoose();
      const existing = await User.findOneAndUpdate(
        { email: session.user.email },
        {
          $setOnInsert: {
            email: session.user.email,
            name: session.user.name || "",
            image: session.user.image || "",
            fullName: session.user.name || "",
            role: "user",
            isBanned: false,
          },
        },
        { upsert: true, returnDocument: "after" }
      ).lean();
      session.user.role = existing?.role || "user";
      session.user.isBanned = Boolean(existing?.isBanned);
      session.user.profileCompleted = Boolean(existing?.profileCompleted);
      session.user.fullName = existing?.fullName || session.user.name || "";
      session.user.branch = existing?.branch || "";
      session.user.yearOfStudy = existing?.yearOfStudy || null;
      session.user.studentId = existing?.studentId || "";
      session.user.phoneNumber = existing?.phoneNumber || "";
      return session;
    },
    async signIn({ user }) {
      await connectMongoose();

      const existing = await User.findOne({ email: user.email });
      if (existing.isBanned) {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const authHandler = NextAuth(authOptions);