// Placeholder cropped from the design screenshot; replace with the SVG exported from Figma.
import logo from '../assets/logo-placeholder.png'

export type LogoProps = Record<string, never>

export default function Logo(_props: LogoProps): React.JSX.Element {
  return <img src={logo} alt="Old Town Market" className="h-11 w-auto" />
}
