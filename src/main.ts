import './styles/main.css';
import { registerChapter, getChapter } from './engine/registry';
import { testChapter } from './chapters/test';
import { App } from './ui/app';

registerChapter(testChapter);

const DEFAULT_CHAPTER = 'test';
// Optional ?chapter=<id>, validated against the registry (dev convenience).
const requested = new URLSearchParams(location.search).get('chapter');
const chapterId = requested && getChapter(requested) ? requested : DEFAULT_CHAPTER;

new App(document.getElementById('game')!, chapterId);
