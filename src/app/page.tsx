import Intro from '@/components/Intro';
import Header from '@/components/Header';
import Journey from '@/components/Journey';
import Projects from '@/components/Projects';
import VillaPlan from '@/components/VillaPlan';
import Process from '@/components/Process';
import Why from '@/components/Why';
import Philosophy from '@/components/Philosophy';
import HomeIntro from '@/components/HomeIntro';
import Faq from '@/components/Faq';
import RealWork from '@/components/RealWork';
import { FAQ_LD, ORG_LD } from '@/data/site';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import PageTone from '@/components/PageTone';
import ProjectImagesProvider from '@/components/ProjectImages';

export default function Home() {
  return (
    <ProjectImagesProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ORG_LD, FAQ_LD]) }} />
      <Intro />
      <Header />
      <main>
        <Journey />
        <HomeIntro />
        <Projects />
        <VillaPlan />
        <Process />
        <RealWork />
        <Why />
        <Philosophy />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <ScrollReveal />
      <PageTone />
    </ProjectImagesProvider>
  );
}
