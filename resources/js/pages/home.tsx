import HeroSection from './sections/HeroSection'
import AboutSection from './sections/AboutSection'
import ServicesSection from './sections/ServicesSection'
import AchievementsSection from './sections/AchievementsSection'
import TechnologiesSection from './sections/TechnologiesSection'
// import ProjectsSection from './sections/ProjectsSection'
import ContactsSection from './sections/ContactsSection'

export default function Home() {
    return (
        <>
            <HeroSection />
            <AboutSection />
            <ServicesSection />
            <AchievementsSection />
            <TechnologiesSection />
            {/*<ProjectsSection limit={3} />*/}
            <ContactsSection />
        </>
    )
}
