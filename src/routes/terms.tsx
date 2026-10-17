import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { LegalBody } from "@/components/legal";
import { seo } from "@/lib/seo";

const sub = "The rules for buying and using products from Jassu Cheats.";

export const Route = createFileRoute("/terms")({
  head: () => seo("Terms and Conditions", sub),
  component: () => (
    <Shell>
      <PageHero eyebrow="Terms" title="Terms and Conditions" sub={sub} />
      <LegalBody
        updated="October 17, 2026"
        sections={[
          { h: "Acceptance", p: ["By creating an account or placing an order you agree to these terms. If you do not agree, please do not use the store."] },
          { h: "Eligibility", p: ["You must be at least 13 years old, or the minimum age required in your country, to use the store. If you are under 18 you need permission from a parent or guardian to buy."] },
          { h: "Products and licenses", p: ["Products are digital addons delivered as license keys or downloads. Each purchase grants you a personal, non-transferable license for one user.", "You may not resell, share, redistribute, crack or reverse-engineer any product or key."] },
          { h: "Updates", p: ["Only the latest version of each product is sold. Updates are included with your purchase for as long as the product is supported. We may change or discontinue a product at any time."] },
          { h: "Payments and pricing", p: ["Prices are shown in USD and may change at any time. Your order is confirmed once payment is received. Coupons cannot be combined unless stated."] },
          { h: "Delivery", p: ["Keys are delivered to the email address entered at checkout and appear in your account under My keys. Please make sure your email is correct."] },
          { h: "Your responsibility", p: ["Jassu Cheats is independent and not affiliated with, endorsed by, or sponsored by Garena or Free Fire. Using third-party addons may break the rules of a game, and you use products at your own risk. We are not responsible for account bans, suspensions or other action taken by game publishers."] },
          { h: "Account termination", p: ["We may suspend or close accounts that break these terms, commit fraud, file false chargebacks or share keys, without a refund."] },
          { h: "Refunds", p: ["Refunds are handled under our Refund Policy."] },
          { h: "Limitation of liability", p: ["Products are provided \"as is\" without warranties of any kind. To the maximum extent allowed by law, our total liability is limited to the amount you paid for the product in question."] },
          { h: "Changes to these terms", p: ["We may update these terms from time to time. Continued use of the store after changes means you accept the updated terms."] },
        ]}
      />
    </Shell>
  ),
});
