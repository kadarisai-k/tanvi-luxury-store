import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import CategoryGrid from "../components/CategoryGrid";
import ProductSection from "../components/ProductSection";
import WhySection from "../components/WhySection";
import Testimonials from "../components/Testimonials";
import { getHomeSections } from "../api/endpoints";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderPlacedInfo, setOrderPlacedInfo] = useState(location.state?.orderPlaced ? location.state : null);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [bestError, setBestError] = useState(false);

  useEffect(() => {
    if (location.state?.orderPlaced) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderPlacedInfo) return;
    const timer = setTimeout(() => setOrderPlacedInfo(null), 10000);
    return () => clearTimeout(timer);
  }, [orderPlacedInfo]);

  useEffect(() => {
    getHomeSections(8)
      .then((data) => {
        setFeatured(data.featured);
        setBestSellers(data.bestSellers);
      })
      .catch(() => {
        setFeaturedError(true);
        setBestError(true);
      })
      .finally(() => {
        setLoadingFeatured(false);
        setLoadingBest(false);
      });
  }, []);

  return (
    <Layout>
      {orderPlacedInfo && (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-3 border border-gold-500/40 bg-gold-500/5 px-5 py-4">
            <CheckCircle2 size={20} className="text-gold-600 shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-ink flex-1">
              Thank you — your order{" "}
              {orderPlacedInfo.orderNumber && (
                <span className="font-medium">{orderPlacedInfo.orderNumber}</span>
              )}{" "}
              has been placed. A confirmation email is on its way.
            </p>
            <button
              onClick={() => setOrderPlacedInfo(null)}
              className="text-muted hover:text-ink shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <Hero />
      <CategoryGrid />
      <ProductSection
        eyebrow="This Season"
        title="Featured Pieces"
        products={featured}
        loading={loadingFeatured}
        error={featuredError}
      />
      <ProductSection
        eyebrow="Beloved Favourites"
        title="Best Sellers"
        products={bestSellers}
        loading={loadingBest}
        error={bestError}
      />
      <WhySection />
      <Testimonials />
    </Layout>
  );
}
