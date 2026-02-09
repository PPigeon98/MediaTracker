import { createRouter, createWebHistory } from 'vue-router';
import PageHome from '../components/PageHome.vue';
import PageDetails from '../components/PageDetails.vue';
import PageSearch from '../components/PageSearch.vue';
import PageSplash from '../components/PageSplash.vue';
import PageLibrary from '../components/PageLibrary.vue';
import { status } from '../utils/types';
import PageKeys from '../components/PageKeys.vue';
import PageSync from '../components/PageSync.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: PageSplash
    },
    {
      path: '/home',
      component: PageHome
    },
    {
      path: '/Details',
      component: PageDetails
    },
    {
      path: '/Search',
      component: PageSearch
    },
    {
      path: '/Keys',
      component: PageKeys
    },
    {
      path: '/Sync',
      component: PageSync
    },
    {
      path: '/Library',
      component: PageLibrary,
      props: (route: any) => {
        const statusMap: Record<string, status> = {
          'tracking': status.tracking,
          'completed': status.completed,
          'onHold': status.onHold,
          'dropped': status.dropped,
          'planned': status.planned
        }
        return {
          show: route.query.show === 'true',
          type: route.query.type ? statusMap[route.query.type as string] : undefined,
          title: route.query.title === 'true'
        }
      }
    }
  ]
});

