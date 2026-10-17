import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { LegalBody } from "@/components/legal";
import { seo } from "@/lib/seo";

const sub = "What we collect, why we collect it, and how we keep it safe.";

export const Route = createFileRoute("/privacy")({
  head: () => seo("Privacy Policy", sub),
  component: () => (
    <Shell>
      <PageHero eyebrow="Privacy" title="Privacy Policy" sub={sub} />
      <LegalBody
        updated="October 17, 2026"
        sections={[
          { h: "What we collect", p: ["Account details: your email address and the name you provide.", "Order details: the products you buy, order numbers, coupons used and your optional Discord username.", "Support messages you send us.", "Basic technical data such as browser type, needed to keep the site working and secure."] },
          { h: "Payment information", p: ["We do not store full card numbers. Payments are handled by our payment provider."] },
          { h: "How we use it", p: ["To create your account, deliver your keys, process orders and refunds, answer support requests, prevent fraud and send important notices about your purchases."] },
          { h: "What we don't do", p: ["We do not sell your personal information. We do not send marketing emails unless you ask for them."] },
          { h: "Who we share it with", p: ["Only the service providers we need to run the store, such as hosting, sign-in and payment providers, and only for that purpose. We may also share information when required by law."] },
          { h: "How long we keep it", p: ["We keep account and order records for as long as your account is open, and afterwards as long as needed for legal, tax and fraud-prevention reasons."] },
          { h: "Security", p: ["Your data is stored with access controls and encrypted connections. No system is perfectly secure, so please use a strong, unique password."] },
          { h: "Your rights", p: ["You can ask us to see, correct or delete your personal information, or close your account, through our contact page."] },
          { h: "Cookies", p: ["We use only the cookies and local storage needed to keep you signed in and remember your cart."] },
          { h: "Children", p: ["The store is not intended for children under 13, and we do not knowingly collect their information."] },
          { h: "Changes", p: ["We may update this policy. The date at the top shows when it last changed."] },
        ]}
      />
    </Shell>
  ),
});
