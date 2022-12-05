import ImagesApiService from './images-service';
import '../css/styles.css';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
  form: document.querySelector('.search-form'),
  galleryContainer: document.querySelector('.gallery'),
  jsGuard: document.querySelector('.guard'),
};

const options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};

let hitsLength = 40;
let isFetching = false;

const imagesApiService = new ImagesApiService();

const observer = new IntersectionObserver(onInfiniteScroll, options);

function onInfiniteScroll(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting && !isFetching) {
      fetchImages();
    }
  });
}

refs.form.addEventListener('submit', onSearch);

function onSearch(e) {
  e.preventDefault();

  imagesApiService.query = e.currentTarget.elements.searchQuery.value;

  if (!imagesApiService.query) {
    Notiflix.Notify.failure(
      'Search box cannot be empty. Please enter the word.'
    );
    return;
  }

  imagesApiService.resetPage();
  clearGalleryContainer();

  fetchImages();
  observer.observe(refs.jsGuard);

  refs.form.reset();
}

function fetchImages() {
  isFetching = true;
  imagesApiService.fetchImages().then(({ totalHits, hits }) => {
    if (hitsLength > totalHits) {
      observer.unobserve(refs.jsGuard);
      Notiflix.Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );
      return;
    } else if (hits.length === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    } else {
      Notiflix.Notify.success(`Hooray! We found ${hitsLength} images.`);

      renderImagesCards(hits);

      const lightbox = new SimpleLightbox('.gallery a', {
        captionsData: 'alt',
        captionDelay: 250,
      });

      lightbox.refresh();

      hitsLength += hits.length;
      isFetching = false;
    }
  });
}

function renderImagesCards(images) {
  const markup = images
    .map(
      image =>
        `<div class="photo-card">
  <a href="${image.largeImageURL}" class="gallery__item">
    <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
  </a>
  <div class="info">
    <p class="info-item"><b>Likes</b>${image.likes}</p>
    <p class="info-item"><b>Views</b>${image.views}</p>
    <p class="info-item"><b>Comments</b>${image.comments}</p>
    <p class="info-item"><b>Downloads</b>${image.comments}</p>
  </div>
</div>`
    )
    .join('');

  refs.galleryContainer.insertAdjacentHTML('beforeend', markup);
}

function clearGalleryContainer() {
  refs.galleryContainer.innerHTML = '';
}
