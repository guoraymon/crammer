import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Exercise from './pages/Exercise';
import Exam from './pages/Exam';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Home />} />
          <Route path='exercise' element={<Exercise />} />
          <Route path="/exam" element={<Exam />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
