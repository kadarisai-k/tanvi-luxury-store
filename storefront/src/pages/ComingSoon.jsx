import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function ComingSoon({ title, message }) {
  return (
    <Layout>
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <span className="eyebrow">Coming Soon</span>
        <h1 className="font-display text-3xl text-ink mt-2 mb-3">{title}</h1>
        <p className="text-muted mb-8">{message}</p>
        <Link to="/shop" className="nav-link text-gold-500 border-b border-gold-500 pb-0.5">
          Continue shopping
        </Link>
      </div>
    </Layout>
  );
}
