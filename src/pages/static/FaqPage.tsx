import { Link } from 'react-router-dom';
import { Accordion } from '@/components/ui/Accordion';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSeo } from '@/lib/seo';

const FAQS = [
  {
    id: 'preorder',
    title: 'How do preorders work?',
    content:
      'Preorders reserve a unit from the production allocation. Each preorder product lists an expected release month. In this demo store the order is recorded immediately; in a live store you would typically be charged when the item ships.',
  },
  {
    id: 'cancel',
    title: 'Can I cancel a preorder?',
    content: 'Yes — any preorder can be cancelled before it ships. Contact us with your order number and we’ll take care of it.',
  },
  {
    id: 'shipping',
    title: 'How much is shipping?',
    content: 'Standard shipping is $9.95 and free on orders of $200 or more after discounts. Express ($24.95) and overnight ($39.95) are also available at checkout.',
  },
  {
    id: 'codes',
    title: 'Do you have promo codes?',
    content: 'Try WELCOME10 for 10% off any order, or VAULT15 for 15% off orders of $150 or more. Only one code can be applied per order.',
  },
  {
    id: 'authentic',
    title: 'Are your products authentic?',
    content: 'Every product in the vault is an original design sourced directly from our studio partners. This demo catalog uses fictional products and placeholder artwork.',
  },
  {
    id: 'damage',
    title: 'What if my figure arrives damaged?',
    content: 'Email us photos of the item and packaging within 7 days of delivery and we’ll send a replacement or refund — no need to ship anything back for minor parts.',
  },
  {
    id: 'account',
    title: 'Do I need an account to order?',
    content: 'No, guest checkout is available. An account lets you track orders, save addresses and sync your wishlist and cart across devices.',
  },
  {
    id: 'payment',
    title: 'Which payment methods do you accept?',
    content: 'This is a demonstration store — payments are simulated and no card details are collected. A live deployment would connect a payment provider such as Stripe.',
  },
];

export default function FaqPage() {
  useSeo({
    title: 'FAQ',
    description: 'Answers about preorders, shipping, promo codes, returns and accounts at Nova Figure Vault.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.title, acceptedAnswer: { '@type': 'Answer', text: f.content } })),
    },
  });
  return (
    <>
      <PageHeader title="Frequently asked questions" crumbs={[{ label: 'FAQ' }]} description="Everything you need to know before adding to cart." />
      <div className="container-page max-w-3xl py-12">
        <Accordion items={FAQS.map((f) => ({ ...f, content: <p>{f.content}</p> }))} defaultOpen="preorder" />
        <p className="mt-8 text-sm text-ink-400">
          Still have questions? <Link to="/contact" className="text-nova-300 hover:text-pulse-300">Contact us</Link>.
        </p>
      </div>
    </>
  );
}
