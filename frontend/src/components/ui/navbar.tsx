import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Features", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center w-full z-50 transition-all duration-500 ease-out"
      style={{ padding: scrolled ? "12px 16px" : "0px" }}
    >
      <motion.div
        className="flex items-center justify-between px-3 transition-all duration-500 ease-out"
        style={{
          maxWidth: scrolled ? "800px" : "100%",
          width: "100%",
          paddingTop: scrolled ? "12px" : "16px",
          paddingBottom: scrolled ? "12px" : "16px",
          borderRadius: scrolled ? "50px" : "0px",
          backgroundColor: scrolled ? "var(--card)" : "transparent",
          backdropFilter: scrolled ? "blur(6px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(6px)" : "none",
          boxShadow: scrolled ? "0 4px 30px rgba(0, 0, 0, 0.08)" : "none",
          borderWidth: scrolled ? "1px" : "0px",
          borderStyle: "solid",
          borderColor: scrolled ? "var(transparent)" : "transparent",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground hidden sm:inline">
            dispatchCore
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              {item.href.startsWith("#") ? (
                <a
                  href={item.href}
                  className="text-sm text-foreground hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  className="text-sm text-foreground hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )}
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2 text-sm text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden flex items-center"
          onClick={toggleMenu}
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="h-6 w-6 text-foreground" />
        </motion.button>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-background z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-foreground" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a
                    href={item.href}
                    className="text-base text-foreground font-medium"
                    onClick={toggleMenu}
                  >
                    {item.label}
                  </a>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6"
              >
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
                  onClick={toggleMenu}
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
