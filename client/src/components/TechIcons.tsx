/**
 * Tech Icons Component
 * Uses Simple Icons CDN for authentic, original brand logos.
 * Icons are served with their official brand colors.
 */

type IconProps = { className?: string };

// Icons that are black by default and need to be inverted in dark mode
const darkInvertSlugs = new Set(['nextdotjs', 'express', 'vercel', 'github', 'threedotjs']);

const makeSimpleIcon = (slug: string, label: string) =>
  ({ className = 'w-6 h-6' }: IconProps) => (
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={label}
      className={`${className} ${darkInvertSlugs.has(slug) ? 'dark:invert' : ''}`}
      style={{ objectFit: 'contain' }}
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );

export const ReactIcon        = makeSimpleIcon('react',             'React');
export const NextJsIcon       = makeSimpleIcon('nextdotjs',         'Next.js');
export const TypeScriptIcon   = makeSimpleIcon('typescript',        'TypeScript');
export const TailwindIcon     = makeSimpleIcon('tailwindcss',       'Tailwind CSS');
export const FramerIcon       = makeSimpleIcon('framer',            'Framer');
export const ThreeJsIcon      = makeSimpleIcon('threedotjs',        'Three.js');
export const FigmaIcon        = makeSimpleIcon('figma',             'Figma');
export const NodeJsIcon       = makeSimpleIcon('nodedotjs',         'Node.js');
export const MongoDBIcon      = makeSimpleIcon('mongodb',           'MongoDB');
export const RedisIcon        = makeSimpleIcon('redis',             'Redis');
export const ExpressIcon      = makeSimpleIcon('express',           'Express');
export const SupabaseIcon     = makeSimpleIcon('supabase',          'Supabase');
export const PostgresIcon     = makeSimpleIcon('postgresql',        'PostgreSQL');
export const GraphQlIcon      = makeSimpleIcon('graphql',           'GraphQL');
export const PythonIcon       = makeSimpleIcon('python',            'Python');
// OpenAI and AWS CDN slugs return 404 — using inline SVG to avoid network errors.
export const OpenAIIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zm-9.022 12.608a4.476 4.476 0 0 1-2.876-1.04l.141-.082 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.495zm-9.661-4.125a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.141-1.646zm-1.26-8.312a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.06 14.518A4.5 4.5 0 0 1 2.34 7.892zm16.597 3.855-5.833-3.387 2.019-1.168a.076.076 0 0 1 .071 0l4.776 2.758a4.5 4.5 0 0 1-.676 8.116v-5.678a.79.79 0 0 0-.357-.641zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.76-2.744a4.5 4.5 0 0 1 6.689 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

export const HuggingFaceIcon  = makeSimpleIcon('huggingface',       'Hugging Face');

export const AwsIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.096.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.143.29-.096.548-.271.765-.511.128-.152.224-.32.272-.504.047-.184.08-.407.08-.671V9.945a6.547 6.547 0 0 0-.735-.136 6.013 6.013 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.479.295.832.295zm6.74.711c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.011c-.048.16-.104.264-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.24c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.814-.415.304-.096.624-.144.958-.144.168 0 .344.008.512.032.175.024.335.056.494.088.152.04.296.08.431.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.27-.352 3.384 1.963 7.559 3.147 11.877 3.147 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.385.614zm1.101-1.253c-.335-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z" />
  </svg>
);
export const VercelIcon       = makeSimpleIcon('vercel',            'Vercel');
export const DockerIcon       = makeSimpleIcon('docker',            'Docker');
export const KubernetesIcon   = makeSimpleIcon('kubernetes',        'Kubernetes');
export const TerraformIcon    = makeSimpleIcon('terraform',         'Terraform');
export const CloudinaryIcon   = makeSimpleIcon('cloudinary',        'Cloudinary');
export const ViteIcon         = makeSimpleIcon('vite',              'Vite');
export const GitHubIcon       = makeSimpleIcon('github',            'GitHub');
export const GitIcon          = makeSimpleIcon('git',               'Git');
export const LinuxIcon        = makeSimpleIcon('linux',             'Linux');
export const NginxIcon        = makeSimpleIcon('nginx',             'Nginx');
export const PrismaIcon       = makeSimpleIcon('prisma',            'Prisma');
export const SanityIcon       = makeSimpleIcon('sanity',            'Sanity');
export const StripeIcon       = makeSimpleIcon('stripe',            'Stripe');

// Fallback icon (generic clock)
export const DefaultIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
