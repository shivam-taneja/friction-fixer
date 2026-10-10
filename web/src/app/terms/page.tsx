import type { Metadata } from "next";
import Link from "next/link";
import {
  ContactLink,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { termsMetadata } from "@/lib/seo";

export const metadata: Metadata = termsMetadata;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      description={termsMetadata.description ?? ""}
      path="/terms"
      updated="10 October 2026"
    >
      <LegalSection id="agreement" title="Agreement">
        <p>
          These terms are the agreement between you and Friction Fixer for the
          website at friction-fixer.shivamtaneja.com and the account you open
          there. By signing in, you agree to these terms and to the{" "}
          <Link className="text-foreground underline" href="/privacy">
            privacy policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="service" title="The service">
        <p>
          Friction Fixer is an agent that looks at how visitors use a website
          you connect, proposes a change to that site through GitHub, and checks
          whether the change helped. If it did not help, the agent can revert
          it and try a different change.
        </p>
        <p>
          The service is still being built. Features can change, pause, or
          arrive later. A connected site may be edited automatically, so use it
          on a site you are willing to have changed.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="Who can use it">
        <p>
          You must be at least 18 years old. The Digital Personal Data
          Protection Act, 2023 treats anyone younger as a child, and this
          service is not offered to children.
        </p>
        <p>
          You must have the authority to connect each website, analytics
          project, and GitHub repository you add. Connecting a property you do
          not control is a breach of these terms.
        </p>
      </LegalSection>

      <LegalSection id="account" title="Your account">
        <p>
          You sign in with Google or GitHub through Firebase Authentication. The
          same email links those providers to one Friction Fixer account. You
          are responsible for the Google or GitHub account you use, and for
          signing out on a shared device.
        </p>
        <p>
          We can refuse, suspend, or close an account that breaks these terms,
          misuses the GitHub App, or puts another person’s site or data at risk.
        </p>
      </LegalSection>

      <LegalSection id="your-property" title="Your site, analytics, and GitHub">
        <p>
          You choose what to connect. The GitHub App can read the repositories
          you grant and open a pull request with a change. Analytics you connect
          are read so the agent can see friction and later measure the change.
        </p>
        <p>
          You keep ownership of your website, your repository, and your
          analytics. You give Friction Fixer permission to access them only for
          the service: finding friction, proposing or applying a change, and
          checking the result. You can remove the GitHub App or disconnect a
          site at any time.
        </p>
      </LegalSection>

      <LegalSection id="automated-changes" title="Automated changes">
        <p>
          The agent can change copy, layout, or other code in a repository you
          authorize, open a pull request, and revert a change that does not
          help. A change can reach the live site when that pull request is
          merged, including by an automatic merge you have allowed.
        </p>
        <p>
          You are responsible for reviewing what runs on your site, for keeping
          backups, and for the customer experience on that site. Friction Fixer
          does not guarantee that a change will increase conversion, stay
          within your brand rules, or be free of defects.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>You will not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Connect a site, repository, or analytics project you are not allowed to change or read.</li>
          <li>Use the service to break the law, or to store or publish someone else’s personal data without a lawful basis.</li>
          <li>Probe, disrupt, or overload the service, Firebase, Vercel, or GitHub.</li>
          <li>Resell the account or present the agent’s output as a guaranteed business result.</li>
        </ul>
      </LegalSection>

      <LegalSection id="ip" title="Intellectual property">
        <p>
          Friction Fixer, its name, and the product interface stay ours. Your
          site content and repository stay yours. You may use the agent’s
          proposed code on the site you connected. You may not copy the product
          itself to offer a competing hosted service.
        </p>
      </LegalSection>

      <LegalSection id="privacy" title="Privacy">
        <p>
          Account data is processed as described in the privacy policy,
          including processing by Firebase and Google, and your rights under the
          Digital Personal Data Protection Act, 2023. These terms do not reduce
          those rights.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" title="No warranty">
        <p>
          The service is provided as available. We do not warrant that it will
          be uninterrupted, that an automated change will help your visitors, or
          that analytics readings will be complete. To the extent the law
          allows, we exclude implied warranties of merchantability, fitness for
          a particular purpose, and non-infringement.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Liability">
        <p>
          Friction Fixer is not liable for lost profits, lost data, or indirect
          or consequential loss arising from your use of the service or from a
          change the agent makes. Our total liability arising out of the
          service is limited to the amount you paid us in the three months
          before the claim. If you have not paid a fee, that amount is zero.
        </p>
        <p>
          Nothing in these terms limits liability that the law of India does not
          allow us to limit, including liability for fraud or for a breach of
          the DPDP Act that cannot be contracted out.
        </p>
      </LegalSection>

      <LegalSection id="ending" title="Ending access">
        <p>
          You can stop using the service and ask us to delete your account from
          the <ContactLink />. We can stop providing the service, or close
          your account, by notice to the email on the account. Sections that
          should survive, including ownership, disclaimers, and liability, keep
          applying.
        </p>
      </LegalSection>

      <LegalSection id="law" title="Law and contact">
        <p>
          These terms are governed by the laws of India. Courts in India have
          jurisdiction over disputes arising from them.
        </p>
        <p>
          Reach us through the <ContactLink />. These terms are the contract for
          the service.
          They are not legal advice about your own website, your visitors’ data,
          or your duties under the DPDP Act.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
