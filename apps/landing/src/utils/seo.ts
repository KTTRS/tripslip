export interface SEOMetaTags {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl?: string;
}

export const defaultSEO: SEOMetaTags = {
  title: 'TripSlip - Digital Field Trip Management Platform',
  description: 'Streamline field trip planning, permission slips, and payments. Connect venues, schools, teachers, and parents in one unified platform.',
  ogTitle: 'TripSlip - Digital Field Trip Management',
  ogDescription: 'The complete platform for managing field trips from planning to execution.',
  ogImage: 'https://tripslip.com/og-image.jpg',
};

export const validateSEOTags = (tags: SEOMetaTags): boolean => {
  return (
    tags.title.length >= 10 && tags.title.length <= 60 &&
    tags.description.length >= 50 && tags.description.length <= 160 &&
    tags.ogTitle.length >= 10 && tags.ogTitle.length <= 60 &&
    tags.ogDescription.length >= 50 && tags.ogDescription.length <= 160 &&
    tags.ogImage.startsWith('http')
  );
};
