import {
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiFramer,
  SiThreedotjs, SiFigma, SiNodedotjs, SiMongodb, SiRedis,
  SiExpress, SiSupabase, SiPostgresql, SiGraphql, SiPython,
  SiVercel, SiDocker, SiKubernetes, SiTerraform, SiVite,
  SiGithub, SiGit, SiLinux, SiNginx, SiPrisma, SiSanity, SiStripe,
  SiCloudinary, SiOpenai, SiHuggingface,
} from 'react-icons/si';
import { FaAws } from 'react-icons/fa';

type IconProps = { className?: string };

const wrap = (Icon: React.ComponentType<{ className?: string }>) =>
  ({ className = 'w-6 h-6' }: IconProps) => <Icon className={className} />;

export const ReactIcon       = wrap(SiReact);
export const NextJsIcon      = wrap(SiNextdotjs);
export const TypeScriptIcon  = wrap(SiTypescript);
export const TailwindIcon    = wrap(SiTailwindcss);
export const FramerIcon      = wrap(SiFramer);
export const ThreeJsIcon     = wrap(SiThreedotjs);
export const FigmaIcon       = wrap(SiFigma);
export const NodeJsIcon      = wrap(SiNodedotjs);
export const MongoDBIcon     = wrap(SiMongodb);
export const RedisIcon       = wrap(SiRedis);
export const ExpressIcon     = wrap(SiExpress);
export const SupabaseIcon    = wrap(SiSupabase);
export const PostgresIcon    = wrap(SiPostgresql);
export const GraphQlIcon     = wrap(SiGraphql);
export const PythonIcon      = wrap(SiPython);
export const OpenAIIcon      = wrap(SiOpenai);
export const HuggingFaceIcon = wrap(SiHuggingface);
export const VercelIcon      = wrap(SiVercel);
export const DockerIcon      = wrap(SiDocker);
export const KubernetesIcon  = wrap(SiKubernetes);
export const TerraformIcon   = wrap(SiTerraform);
export const CloudinaryIcon  = wrap(SiCloudinary);
export const ViteIcon        = wrap(SiVite);
export const GitHubIcon      = wrap(SiGithub);
export const GitIcon         = wrap(SiGit);
export const LinuxIcon       = wrap(SiLinux);
export const NginxIcon       = wrap(SiNginx);
export const PrismaIcon      = wrap(SiPrisma);
export const SanityIcon      = wrap(SiSanity);
export const StripeIcon      = wrap(SiStripe);
export const AwsIcon         = wrap(FaAws);

export const DefaultIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
