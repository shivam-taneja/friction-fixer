import type { Metadata } from "next";
import Link from "next/link";
import {
  ContactLink,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { privacyMetadata } from "@/lib/seo";

export const metadata: Metadata = privacyMetadata;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description={privacyMetadata.description ?? ""}
      path="/privacy"
      updated="10 October 2026"
    >
      <LegalSection id="who-we-are" title="Who we are">
        <p>
          Friction Fixer is a website that signs you in, and an agent that can
          study a site you connect, propose a change in GitHub, and check
          whether that change helped. For the{" "}
          <a
            className="text-foreground underline"
            href="https://www.meity.gov.in/data-protection-framework"
          >
            Digital Personal Data Protection Act, 2023
          </a>{" "}
          (“DPDP Act”), Friction Fixer is the data fiduciary for personal data
          we decide to process. This page is our notice under the DPDP Act.
        </p>
        <p>
          Questions and grievance requests go through the <ContactLink />.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="Personal data we collect">
        <p>When you create an account or sign in, we process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your name, email address, and profile image, as shared by Google or
            GitHub.
          </li>
          <li>
            The sign-in provider and the account identifier that provider gives
            Firebase.
          </li>
          <li>A Firebase user id, and the session cookies described below.</li>
        </ul>
        <p>
          If you connect a website, an analytics project, or the Friction Fixer
          GitHub App, we process the site URL, the repositories you authorize,
          installation events GitHub sends us, and the analytics connection
          details needed to read that site’s visitor metrics. Those metrics can
          describe how visitors use the site you connected. We use them to find
          friction and to check a change.
        </p>
        <p>
          On friction-fixer.shivamtaneja.com itself, Vercel Web Analytics
          records page views. That product does not use a cookie and does not
          receive your name or email.
        </p>
      </LegalSection>

      <LegalSection id="why" title="Why we use it">
        <p>We use personal data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and keep your account signed in.</li>
          <li>Link Google and GitHub when they share the same email.</li>
          <li>Run the agent on a site and repository you authorize.</li>
          <li>
            Protect the service against abuse and keep a record of account
            changes you ask for.
          </li>
        </ul>
        <p>
          You provide account data by choosing Continue with Google or Continue
          with GitHub. That sign-in is the consent and the specified purpose for
          providing the account. Connecting a site, analytics, or GitHub is a
          separate step, and we use that data only to provide the agent for the
          property you connected.
        </p>
      </LegalSection>

      <LegalSection id="firebase" title="Firebase, Google, GitHub, and Vercel">
        <p>
          Sign-in is handled by{" "}
          <a
            className="text-foreground underline"
            href="https://firebase.google.com/support/privacy"
          >
            Firebase Authentication
          </a>
          , a Google service. Google and GitHub are the identity providers. When
          you use them, they process your sign-in under their own policies:{" "}
          <a
            className="text-foreground underline"
            href="https://policies.google.com/privacy"
          >
            Google
          </a>{" "}
          and{" "}
          <a
            className="text-foreground underline"
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          >
            GitHub
          </a>
          .
        </p>
        <p>
          After Firebase verifies you, our server stores a signed session. If we
          keep an account record, it is stored in Cloud Firestore, which is also
          operated by Google. Google processes that data for us, as a data
          processor, so we can authenticate you and store the account and
          product records the service needs.
        </p>
        <p>
          The site is hosted on Vercel. Vercel’s privacy policy is at{" "}
          <a
            className="text-foreground underline"
            href="https://vercel.com/legal/privacy-policy"
          >
            vercel.com/legal/privacy-policy
          </a>
          . GitHub processes repository access and webhooks when you install the
          GitHub App.
        </p>
        <p>
          We do not sell personal data. We do not use it for cross-context
          advertising.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          After a successful sign-in we set two cookies, <code>ff-session</code>{" "}
          and <code>ff-session-refresh</code>. They are HTTP-only, sent only to
          this site, and last up to 12 days. In production they are marked
          secure. They exist so the server can recognise your account. Signing
          out clears them.
        </p>
        <p>
          The marketing site does not set an analytics or advertising cookie.
          Vercel Web Analytics runs without a cookie.
        </p>
      </LegalSection>

      <LegalSection id="where" title="Where data is processed">
        <p>
          The DPDP Act allows a transfer of personal data outside India except
          to a country the Central Government restricts by notification. Google
          Firebase and Google Cloud may process account data outside India,
          including in the United States, depending on the Firebase project.
          Vercel and GitHub may also process data outside India.
        </p>
        <p>
          We rely on those providers’ contracts and security measures for that
          processing. We do not transfer personal data to a country the Central
          Government has restricted.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="How long we keep it">
        <p>
          Session cookies expire after 12 days, or sooner if you sign out. We
          keep account and connection records while your account is open and you
          use the service. If you ask us to erase the account, we delete the
          personal data we still hold, except where we must keep a limited
          record to meet a legal duty or to resolve a dispute already underway.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="Your rights under the DPDP Act">
        <p>As a data principal, you can ask us to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Give you a summary of the personal data we process and the
            processing activities.
          </li>
          <li>
            Correct, complete, or update personal data that is inaccurate or
            incomplete.
          </li>
          <li>
            Erase personal data you provided, unless the law requires us to keep
            it.
          </li>
          <li>
            Withdraw consent for processing that is based on consent. Withdrawal
            does not affect processing already done.
          </li>
          <li>
            Name another person to exercise these rights if you die or become
            unable to exercise them.
          </li>
        </ul>
        <p>
          Use the <ContactLink /> and say which right you want to use. We will
          respond within the time the DPDP Act and the Rules notified under it
          require. If we cannot complete a request, we will tell you why.
        </p>
        <p>
          You can also raise a grievance with us first. If you are not satisfied
          with the response, you may complain to the Data Protection Board of
          India in the manner set out in the DPDP Act and the Rules.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>
          The DPDP Act treats anyone under 18 as a child. Friction Fixer is not
          offered to children, and we do not knowingly process a child’s
          personal data. If you believe a child has signed in, write through the{" "}
          <ContactLink /> and we will delete the account.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this notice">
        <p>
          If we change what we collect or why, we will update this page and the
          date at the top. Where the DPDP Act requires a fresh notice, we will
          give it before we rely on the new purpose. The{" "}
          <Link className="text-foreground underline" href="/terms">
            terms of use
          </Link>{" "}
          sit alongside this notice.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
