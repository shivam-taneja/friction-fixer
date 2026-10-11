import { AuthCta } from "@/components/auth/auth-cta";

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="bg-primary px-5 py-17.5 text-center text-primary-foreground">
      <h2 className="mb-4.25 font-display text-[40px] leading-[1.2] font-semibold max-sm:text-[31px]">
        Your next improvement
        <br />
        shouldn’t wait on your to-do list.
      </h2>
      <p className="mb-6.75 text-sm">
        Give your website an agent that closes the loop.
      </p>
      <AuthCta
        signedIn={signedIn}
        signedOutLabel="Meet Friction Fixer"
        variant="ink"
        size="lg"
      />
    </section>
  );
}
