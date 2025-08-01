
"use client";

import * as React from "react"
import { useCorabo } from "@/contexts/CoraboContext"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { CompanyCard } from "./CompanyCard";

export function CompaniesCarousel() {
  const { users } = useCorabo();
  const companies = users.filter(u => u.type === 'provider' && u.profileSetupData?.providerType === 'company');

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2">
        {companies.map((company, index) => (
          <CarouselItem key={index} className="pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5">
            <div className="p-1">
              <CompanyCard company={company} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
