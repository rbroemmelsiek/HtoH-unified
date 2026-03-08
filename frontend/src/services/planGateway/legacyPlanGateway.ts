import axios from 'axios';
import qs from 'qs';
import { PlanGateway, PlanGatewayPostResponse, PlanGatewayResponse, PlanUpdateCallback, Unsubscribe } from './types';
import { makeShortRow } from '../../store/planApp/helpers/familyFunctions';
import { PlanRow } from '../../types/planApp/planRow';

// Helper to get plan AJAX object from window or use defaults
function getPlanAjaxObject() {
  // @ts-ignore
  let planAjaxObj = (window as any).planAjaxObj;
  
  // Development fallback - return empty plan instead of making invalid requests
  if (!planAjaxObj || !planAjaxObj.site_url || !planAjaxObj.ajax_url) {
    // Return a mock object that will trigger empty plan response
    return {
      ajax_url: '',
      nonce: '',
      userId: 0,
      site_url: '',
    };
  }
  
  return planAjaxObj;
}

async function fetchData(params: Record<string, unknown> & { action: string }): Promise<{ data: PlanGatewayResponse }> {
  const planAjaxObj = getPlanAjaxObject();
  
  // Check if planAjaxObj is properly configured
  if (!planAjaxObj.site_url || !planAjaxObj.ajax_url) {
    console.warn('[PlanGateway] Plan AJAX object not properly configured:', {
      hasSiteUrl: !!planAjaxObj.site_url,
      hasAjaxUrl: !!planAjaxObj.ajax_url,
      siteUrl: planAjaxObj.site_url,
      ajaxUrl: planAjaxObj.ajax_url,
    });
    console.warn('[PlanGateway] Returning empty plan. Ensure window.planAjaxObj is set in parent page.');
    return { data: { root: { children: [] } } };
  }
  
  console.log('[PlanGateway] Fetching plan data:', {
    action: params.action,
    siteUrl: planAjaxObj.site_url,
    ajaxUrl: planAjaxObj.ajax_url,
  });
  
  // Construct URL properly - handle relative and absolute URLs
  let url: string;
  try {
    // If ajax_url is already a full URL, use it directly
    if (planAjaxObj.ajax_url.startsWith('http://') || planAjaxObj.ajax_url.startsWith('https://')) {
      url = planAjaxObj.ajax_url;
    } else if (planAjaxObj.site_url.startsWith('http://') || planAjaxObj.site_url.startsWith('https://')) {
      // Construct from site_url and ajax_url
      const baseUrl = planAjaxObj.site_url.endsWith('/') 
        ? planAjaxObj.site_url.slice(0, -1) 
        : planAjaxObj.site_url;
      const ajaxPath = planAjaxObj.ajax_url.startsWith('/')
        ? planAjaxObj.ajax_url
        : '/' + planAjaxObj.ajax_url;
      url = baseUrl + ajaxPath;
    } else {
      // Relative URL - use ajax_url as relative path
      url = planAjaxObj.ajax_url.startsWith('/') 
        ? planAjaxObj.ajax_url 
        : '/' + planAjaxObj.ajax_url;
    }
    
    // Validate URL only if it's absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url); // Will throw if invalid
    }
  } catch (urlError) {
    // Invalid URL - return empty plan
    console.warn('Invalid URL constructed, returning empty plan:', urlError);
    return { data: { root: { children: [] } } };
  }
  
  try {
    const response = await axios({
      url,
      method: 'GET',
      params: {
        _ajax_nonce: planAjaxObj.nonce,
        ...params,
      },
    });
    return response;
  } catch (error: any) {
    // Check if it's a URL construction error
    if (error?.message?.includes('Invalid URL') || error?.code === 'ERR_INVALID_URL') {
      console.warn('Invalid URL in axios request, returning empty plan');
      return { data: { root: { children: [] } } };
    }
    console.error('Fetch error:', error);
    // Return empty plan on error
    return { data: { root: { children: [] } } };
  }
}

async function postData(inputParams: Record<string, unknown> & { action: string }): Promise<{ data: PlanGatewayPostResponse }> {
  const planAjaxObj = getPlanAjaxObject();
  
  // Convert row to short row if present
  if (inputParams.row) {
    inputParams.row = makeShortRow(inputParams.row as PlanRow);
  }

  // Check if planAjaxObj is properly configured
  if (!planAjaxObj.site_url || !planAjaxObj.ajax_url) {
    console.warn('Plan AJAX object not properly configured');
    return { data: { result: 0 } };
  }
  
  // Construct URL properly - handle relative and absolute URLs
  let url: string;
  try {
    // If ajax_url is already a full URL, use it directly
    if (planAjaxObj.ajax_url.startsWith('http://') || planAjaxObj.ajax_url.startsWith('https://')) {
      url = planAjaxObj.ajax_url;
    } else if (planAjaxObj.site_url.startsWith('http://') || planAjaxObj.site_url.startsWith('https://')) {
      // Construct from site_url and ajax_url
      const baseUrl = planAjaxObj.site_url.endsWith('/') 
        ? planAjaxObj.site_url.slice(0, -1) 
        : planAjaxObj.site_url;
      const ajaxPath = planAjaxObj.ajax_url.startsWith('/')
        ? planAjaxObj.ajax_url
        : '/' + planAjaxObj.ajax_url;
      url = baseUrl + ajaxPath;
    } else {
      // Relative URL - use ajax_url as relative path
      url = planAjaxObj.ajax_url.startsWith('/') 
        ? planAjaxObj.ajax_url 
        : '/' + planAjaxObj.ajax_url;
    }
    
    // Validate URL only if it's absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url); // Will throw if invalid
    }
  } catch (urlError) {
    // Invalid URL - return error result
    console.warn('Invalid URL constructed:', urlError);
    return { data: { result: 0 } };
  }

  try {
    const response = await axios({
      url,
      method: 'POST',
      data: qs.stringify({
        _ajax_nonce: planAjaxObj.nonce,
        ...inputParams,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response;
  } catch (error) {
    console.error('Post error:', error);
    // Return error result
    return { data: { result: 0 } };
  }
}

export default class LegacyPlanGateway implements PlanGateway {
  fetch(
    action: string,
    params: Record<string, unknown>
  ): Promise<PlanGatewayResponse> {
    return fetchData({ action, ...params }).then(
      (response) => response.data
    ) as Promise<PlanGatewayResponse>;
  }

  post(
    action: string,
    payload: Record<string, unknown>
  ): Promise<PlanGatewayPostResponse> {
    return postData({ action, ...payload }).then(
      (response) => response.data
    ) as Promise<PlanGatewayPostResponse>;
  }

  subscribe(
    action: string,
    params: Record<string, unknown>,
    callback: PlanUpdateCallback
  ): Unsubscribe {
    this.fetch(action, params)
      .then(callback)
      .catch((e) => console.error('Fetch failed in subscribe', e));
    return () => {};
  }
}
