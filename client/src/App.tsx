import { PageContainer } from './components/layout/PageContainer';
import { IndexTrendSection } from './components/index/IndexTrendSection';
import { NewsSection } from './components/news/NewsSection';

export function App() {
  return (
    <PageContainer>
      <IndexTrendSection />
      <NewsSection />
    </PageContainer>
  );
}
