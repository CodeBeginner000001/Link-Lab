"use client";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { plans } from "../../../utils/content";
export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[hsl(var(--primary))] uppercase font-semibold text-sm tracking-wider">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 tracking-[-3px] leading-12 md:leading-14">
            Simple, Transparent
            <br />
            <span className="gradient-text">Credit-Based Pricing</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--muted-foreground))] mb-16">
            Pay only for what you use. Start free and scale as you grow.
            <br />
            Upgrade or downgrade anytime.
          </p>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-6 max-w-5xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.4,
                },
              },
            }}
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`glass-card p-8 relative ${plan.popular ? "border-[hsl(var(--primary)/0.5)] scale-105 shadow-lg":""} mx-auto w-full max-lg:max-w-md`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold">
                      <Zap className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${plan.popular? 'bg-[hsl(var(--primary)/0.8)]': 'bg-[hsl(var(--secondary))]'}`}>
                    <plan.icon className={`w-6 h-6 ${plan.popular? 'text-[hsl(var(--primary-foreground))]': 'text-[hsl(var(--primary))]'}`}/>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-[hsl(var(--muted-foreground))]">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                      <span className="text-sm text-[hsl(var(--foreground))]/80">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full cursor-pointer"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
