import { Link } from 'react-router-dom';
import { StaticPage } from './StaticPage';

export default function AboutPage() {
  return (
    <StaticPage
      title="About Figure Haven"
      description="Who we are, how we choose what we stock and why we obsess over packaging."
      intro="A small team of collectors building the shop we always wanted to buy from."
    >
      <p>
        Figure Haven started with a cramped shelf, a cheap LED strip and a conviction: collectible figures deserve to be shopped for
        the way they’re displayed — with care, good lighting and zero guesswork. We stock original scale figures, statues, chibi-style
        minis, articulated action figures and the display gear to show them off.
      </p>
      <h2>What we believe</h2>
      <ul>
        <li><strong>Original over imitation.</strong> Every character and sculpt in our catalog is an original design from our studio partners.</li>
        <li><strong>Honest preorders.</strong> Clear release windows, proactive delay notices and the freedom to cancel before shipping.</li>
        <li><strong>Packing like it’s ours.</strong> Double-boxing, foam corners and crush-resistant cartons on every order.</li>
        <li><strong>Collectors first.</strong> Quick answers from people who actually own the things we sell.</li>
      </ul>
      <h2>Our studio partners</h2>
      <p>
        We work with independent studios — from Lumen Forge’s luminous effect parts to Vaultline’s display cases — to bring small-batch
        pieces to collectors worldwide.
      </p>
      <h2>A note about this site</h2>
      <p>
        This storefront is a demonstration build. All products, brands, characters and reviews are fictional placeholders, and checkout
        does not process real payments. Questions? <Link to="/contact">Get in touch</Link>.
      </p>
    </StaticPage>
  );
}
