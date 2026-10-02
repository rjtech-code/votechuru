import TopHeader from './TopHeader'
import Navbar from './Navbar'

/**
 * Two-tier site header. The navigation bar is a sibling of the <header> (not a child)
 * so that it can stay sticky while the navy top header scrolls away.
 */
export default function Header() {
  return (
    <>
      <header>
        <TopHeader />
      </header>
      <Navbar />
    </>
  )
}
