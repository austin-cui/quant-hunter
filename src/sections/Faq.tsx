import { HelpCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'
import SectionHeading from '@/components/site/SectionHeading'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="FAQ"
        title="投递前常见问题"
      />
      <Accordion type="single" collapsible className="space-y-3">
        {siteConfig.faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="rounded-xl border border-border bg-card px-5"
          >
            <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline hover:text-primary">
              <span className="flex items-center gap-2.5">
                <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                {f.q}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pl-7 text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
