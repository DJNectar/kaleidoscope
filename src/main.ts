import './styles/main.css';
import { registerChapter, getChapter } from './engine/registry';
import { testChapter } from './chapters/test';
import { ch1 } from './chapters/ch1';
import { App } from './ui/app';

registerChapter(ch1);
registerChapter(testChapter, { listed: false }); // dev: ?chapter=test

const DEFAULT_CHAPTER = 'ch1';
// Optional ?chapter=<id>, validated against the registry (dev convenience).
const requested = new URLSearchParams(location.search).get('chapter');
const chapterId = requested && getChapter(requested) ? requested : DEFAULT_CHAPTER;

new App(document.getElementById('game')!, chapterId);
