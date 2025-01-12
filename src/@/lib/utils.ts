import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLinkByUrlFetch, getLinksFetch } from './actions/links.ts';
import { getConfig, isConfigured } from './config.ts';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TabInfo {
  url: string;
  title: string;
}

export async function getCurrentTabInfo(): Promise<{ title: string | undefined; url: string | undefined }> {
  const tabs = await getBrowser().tabs.query({ active: true, currentWindow: true });
  const { url, title } = tabs[0];
  return { url, title };
}

export function getBrowser() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return typeof browser !== 'undefined' ? browser : chrome;
}

export function getChromeStorage() {
  return typeof chrome !== 'undefined' && !!chrome.storage;
}

export async function getStorageItem(key: string) {
  if (getChromeStorage()) {
    const result = await getBrowser().storage.local.get([key]);
    return result[key];
  } else {
    return getBrowser().storage.local.get(key);
  }
}

export const checkDuplicatedItem = async () => {
  const config = await getConfig();
  const currentTab = await getCurrentTabInfo();
  const { response } = await getLinksFetch(config.baseUrl, config.apiKey);
  const formatLinks = response.map((link) => link.url);
  return formatLinks.includes(currentTab.url ?? '');
};

export async function setStorageItem(key: string, value: string) {
  if (getChromeStorage()) {
    return await chrome.storage.local.set({ [key]: value });
  } else {
    await getBrowser().storage.local.set({ [key]: value });
    return Promise.resolve();
  }
}

export function openOptions() {
  getBrowser().runtime.openOptionsPage();
}

export async function updateBadge(url?: string | undefined) {
  const currentUrl = url || (await getCurrentTabInfo()).url;

  if (!currentUrl) {
    return
  }

  const configured = await isConfigured();

  if (!configured) {
    return;
  }

  const config = await getConfig();
  const browser = getBrowser();

  if (!config.showBadge) {
    // Make sure that the badge is hidden
    browser.action.setBadgeText({
      text: '',
    });
    return;
  }

  try {
    const existingLink = await getLinkByUrlFetch(config.baseUrl, currentUrl, config.apiKey);

    if (existingLink) {
      browser.action.setBadgeText({
        text: '✓',
      });
      browser.action.setBadgeBackgroundColor({
        color: '#02B902',
      });
      browser.action.setBadgeTextColor({
        color: '#ffffff',
      });
    } else {
      browser.action.setBadgeText({
        text: '',
      });
    }
  } catch (error) {
    console.error(error)
  }
}
