import { useEffect, useRef, useState } from 'react';
import { WalletTopUpModal } from "../components/WalletTopUpModal";
import { ArrowUpRight, CheckCircle2, Coins, Zap, CreditCard, Lock, RefreshCw, Loader2 } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { useSearchParams } from 'react-router-dom';
import {
	AppCallout,
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppPrimaryButton,
	AppSecondaryButton,
	AppStatCard,
	AppStatGrid,
	AppSurface,
} from '../components/AppPageLayout';
import { api } from '../lib/api-client';
import {
	type BillingInterval,
	type HostedPlanId,
	PRICING_PLANS,
	getHostedCheckoutProductId,
	getHostedPlanBySlug,
} from '../lib/pricing';
import {
	FEATURE_LABELS,
	PLAN_FEATURES,
	PLAN_NAMES,
	minimumPlanForFeature,
	normalizePlanSlug,
	type PlanFeature,
} from '../lib/entitlements';

type BillingAccount = {
	id: string;
	status: string;
	plan_slug: string;
	plan_name?: string | null;
	subscription_status?: string | null;
	current_period_end?: string | null;
	billing_email?: string | null;
	external_customer_id: string;
	polar_customer_id?: string | null;
	available_requests?: number;
	auto_recharge_enabled?: boolean;
	auto_recharge_threshold?: number | null;
	auto_recharge_amount_cents?: number | null;
	metadata?: {
		recurring_interval?: string;
		active_meter_count?: number;
		granted_benefits?: unknown[];
		internal_unlimited?: boolean;
		protected_requests?: string;
		team_access?: string;
		retention?: string;
		support?: string;
		features?: PlanFeature[];
		locked_features?: PlanFeature[];
	};
};

type BillingActionResponse = {
	url?: string;
};

type BillingAccountMetadata = {
	recurring_interval?: string;
	active_meter_count?: number;
	granted_benefits?: unknown[];
	internal_unlimited?: boolean;
	protected_requests?: string;
	team_access?: string;
	retention?: string;
	support?: string;
	features?: PlanFeature[];
	locked_features?: PlanFeature[];
};

function normalizeBillingAccount(raw: unknown): BillingAccount | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const value = raw as Record<string, unknown>;
	const metadataRaw =
		value.metadata && typeof value.metadata === 'object' ? (value.metadata as Record<string, unknown>) : {};
	const grantedBenefits = Array.isArray(metadataRaw.granted_benefits) ? metadataRaw.granted_benefits : [];
	const metadata: BillingAccountMetadata = {
		recurring_interval:
			typeof metadataRaw.recurring_interval === 'string' ? metadataRaw.recurring_interval : undefined,
		active_meter_count:
			typeof metadataRaw.active_meter_count === 'number' ? metadataRaw.active_meter_count : 0,
		granted_benefits: grantedBenefits,
		internal_unlimited: metadataRaw.internal_unlimited === true,
		protected_requests:
			typeof metadataRaw.protected_requests === 'string' ? metadataRaw.protected_requests : undefined,
		team_access: typeof metadataRaw.team_access === 'string' ? metadataRaw.team_access : undefined,
		retention: typeof metadataRaw.retention === 'string' ? metadataRaw.retention : undefined,
		support: typeof metadataRaw.support === 'string' ? metadataRaw.support : undefined,
		features: Array.isArray(metadataRaw.features)
			? metadataRaw.features.filter((feature): feature is PlanFeature => typeof feature === 'string' && feature in FEATURE_LABELS)
			: undefined,
		locked_features: Array.isArray(metadataRaw.locked_features)
			? metadataRaw.locked_features.filter((feature): feature is PlanFeature => typeof feature === 'string' && feature in FEATURE_LABELS)
			: undefined,
	};

	return {
		id: typeof value.id === 'string' ? value.id : 'unknown',
		status: typeof value.status === 'string' ? value.status : 'inactive',
		plan_slug: typeof value.plan_slug === 'string' ? value.plan_slug : 'unpaid',
		plan_name: typeof value.plan_name === 'string' ? value.plan_name : null,
		subscription_status:
			typeof value.subscription_status === 'string' ? value.subscription_status : null,
		current_period_end:
			typeof value.current_period_end === 'string' ? value.current_period_end : null,
		billing_email: typeof value.billing_email === 'string' ? value.billing_email : null,
		external_customer_id:
			typeof value.external_customer_id === 'string' ? value.external_customer_id : '',
		polar_customer_id:
			typeof value.polar_customer_id === 'string' ? value.polar_customer_id : null,
		available_requests: typeof value.available_requests === 'number' ? value.available_requests : 0,
		auto_recharge_enabled: typeof value.auto_recharge_enabled === 'boolean' ? value.auto_recharge_enabled : false,
		auto_recharge_threshold: typeof value.auto_recharge_threshold === 'number' ? value.auto_recharge_threshold : null,
		auto_recharge_amount_cents: typeof value.auto_recharge_amount_cents === 'number' ? value.auto_recharge_amount_cents : null,
		metadata,
	};
}

const hostedPlans = PRICING_PLANS.filter(
	(plan): plan is (typeof PRICING_PLANS)[number] & { id: HostedPlanId } =>
		plan.id === 'growth' || plan.id === 'scale',
);

export default function BillingPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [account, setAccount] = useState<BillingAccount | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
	const [togglingRecharge, setTogglingRecharge] = useState(false);
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const [checkoutNotice, setCheckoutNotice] = useState('');
	const [billingPeriod, setBillingPeriod] = useState<BillingInterval>(
		searchParams.get('period') === 'annual' ? 'annual' : 'monthly',
	);
	const autoCheckoutStarted = useRef(false);
	const billingUnavailable =
		error.includes('POLAR_ACCESS_TOKEN') ||
		error.includes('not configured') ||
		error.includes('Unable to create Polar');

	
	const handleToggleAutoRecharge = async () => {
		if (!account) return;
		setTogglingRecharge(true);
		try {
			const newState = !account.auto_recharge_enabled;
			await api.configureAutoRecharge(newState);
			const raw = await api.getBillingAccount();
			const data = normalizeBillingAccount(raw);
			if (data) setAccount(data);
		} catch (err) {
			console.error('Failed to toggle auto recharge', err);
		} finally {
			setTogglingRecharge(false);
		}
	};

	const loadAccount = async () => {
		setError('');
		setLoading(true);
		try {
			const raw = await api.getBillingAccount();
			const data = normalizeBillingAccount(raw);
			if (!data) {
				throw new Error('Billing account payload was invalid');
			}
			setAccount(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to load billing account');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadAccount();
	}, []);

	useEffect(() => {
		setBillingPeriod(searchParams.get('period') === 'annual' ? 'annual' : 'monthly');
	}, [searchParams]);

	const handleCheckout = async (
		productId?: string,
		planId?: string | null,
		periodOverride?: BillingInterval,
	) => {
		if (!productId) {
			setError('Checkout is not available right now. Please contact support.');
			return;
		}

		setBusyAction(productId);
		setError('');
		try {
			const period = periodOverride || billingPeriod;
			const successUrl = new URL('/billing', window.location.origin);
			successUrl.searchParams.set('checkout', 'success');
			successUrl.searchParams.set('period', period);
			if (planId) {
				successUrl.searchParams.set('plan', planId);
			}

			const response = await api.createBillingCheckout(productId, successUrl.toString()) as BillingActionResponse;
			if (response?.url) {
				window.location.href = response.url;
				return;
			}
			throw new Error('Polar checkout URL was not returned');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to start checkout');
		} finally {
			setBusyAction(null);
		}
	};

	const handlePortal = async () => {
		setBusyAction('portal');
		setError('');
		try {
			const response = await api.createBillingPortal(`${window.location.origin}/billing`) as BillingActionResponse;
			if (response?.url) {
				window.location.href = response.url;
				return;
			}
			throw new Error('Polar customer portal URL was not returned');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to open customer portal');
		} finally {
			setBusyAction(null);
		}
	};

	const handleSync = async () => {
		setBusyAction('sync');
		setError('');
		try {
			const raw = await api.syncBillingAccount();
			const data = normalizeBillingAccount(raw);
			if (!data) {
				throw new Error('Billing sync payload was invalid');
			}
			setAccount(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to sync billing account');
		} finally {
			setBusyAction(null);
		}
	};

	useEffect(() => {
		if (searchParams.get('checkout') !== 'success') {
			return;
		}

		setCheckoutNotice('Payment completed. Syncing your account now.');
		void handleSync().finally(() => {
			setSearchParams((current) => {
				const next = new URLSearchParams(current);
				next.delete('checkout');
				return next;
			}, { replace: true });
		});
	}, [searchParams, setSearchParams]);

	useEffect(() => {
		if (loading || autoCheckoutStarted.current || searchParams.get('checkout') !== '1') {
			return;
		}

		const planId = searchParams.get('plan');
		const period = searchParams.get('period') === 'annual' ? 'annual' : 'monthly';
		const normalizedPlanId = planId === 'scale' ? 'scale' : planId === 'growth' ? 'growth' : null;
		const productId = normalizedPlanId ? getHostedCheckoutProductId(normalizedPlanId, period) : undefined;
		autoCheckoutStarted.current = true;
		void handleCheckout(productId, normalizedPlanId, period);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, searchParams]);

	const displayPlan = getHostedPlanBySlug(account?.plan_slug);
	const isInternalUnlimited = account?.metadata?.internal_unlimited === true;
	const hasPolarCustomer = Boolean(account?.polar_customer_id);
	const normalizedPlan = normalizePlanSlug(account?.plan_slug);
	const allowedFeatures = account?.metadata?.features?.length
		? account.metadata.features
		: PLAN_FEATURES[normalizedPlan];
	const lockedFeatures = account?.metadata?.locked_features
		?? (Object.keys(FEATURE_LABELS) as PlanFeature[]).filter((feature) => !allowedFeatures.includes(feature));
	const requestedFeatureParam = searchParams.get('feature');
	const requestedFeature =
		requestedFeatureParam && requestedFeatureParam in FEATURE_LABELS
			? requestedFeatureParam as PlanFeature
			: null;
	const requestedFeaturePlan = requestedFeature ? minimumPlanForFeature(requestedFeature) : null;
	const requestedFeatureUnlocked = requestedFeature ? allowedFeatures.includes(requestedFeature) : false;

	return (
		<AppPage maxWidth="6xl">
			<SEOMeta title="Billing" noindex />
			<AppPageHeader
				eyebrow="Subscription"
				eyebrowIcon={CreditCard}
				title="Billing"
				description="Manage your Koreshield subscription, upgrade your plan, and keep your account in sync."
				icon={CreditCard}
				actions={
					<AppSecondaryButton onClick={() => void handleSync()} disabled={busyAction === 'sync'}>
						<RefreshCw className={`h-4 w-4 ${busyAction === 'sync' ? 'animate-spin' : ''}`} />
						Refresh state
					</AppSecondaryButton>
				}
				stats={!loading && account ? [
					{ label: 'Plan', value: displayPlan?.name || (normalizedPlan === 'unpaid' ? 'No active plan' : account.plan_name || account.plan_slug) },
					{ label: 'Status', value: <span className="capitalize">{account.subscription_status || account.status || 'inactive'}</span> },
				] : undefined}
			/>

			{error ? (
				<AppCallout variant="warning" className="border-destructive/30 bg-destructive/10 text-destructive">
					{error}
				</AppCallout>
			) : null}
			{billingUnavailable ? (
				<AppCallout variant="warning">
					Hosted billing is not fully configured in this environment. Product access remains locked until checkout is available and an active paid subscription is confirmed. Contact support if you need help activating your account.
				</AppCallout>
			) : null}
			{checkoutNotice ? (
				<AppCallout variant="success">{checkoutNotice}</AppCallout>
			) : null}
			{requestedFeature && !requestedFeatureUnlocked ? (
				<AppCallout variant="info">
					<strong>{FEATURE_LABELS[requestedFeature]}</strong> starts on {PLAN_NAMES[requestedFeaturePlan ?? 'growth']}. Choose a plan below to unlock it for this workspace.
				</AppCallout>
			) : null}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
				<AppPageSection title="Current account" description="Your active plan and subscription details." variant="card" className="mb-0">
					{loading ? (
						<div className="text-sm text-muted-foreground">Loading billing account...</div>
					) : (
						<>
						<AppStatGrid columns={2} className="mb-0">
							<AppStatCard 
                                label="Wallet Balance" 
                                value={<span className="text-2xl font-bold">{(account?.available_requests || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">reqs</span></span>} 
                                icon={Coins} 
                            />
							<div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 md:p-8 flex items-center justify-between">
								<div className="flex flex-col gap-2">
									<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
										Auto-Recharge
									</p>
									<p className="text-2xl font-bold text-foreground capitalize">
										{account?.auto_recharge_enabled ? 'Enabled' : 'Disabled'}
									</p>
								</div>
								<button 
									onClick={handleToggleAutoRecharge}
									disabled={togglingRecharge}
									className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
										account?.auto_recharge_enabled 
											? 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/20' 
											: 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
									}`}
								>
									{togglingRecharge ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
								</button>
							</div>
							<AppStatCard label="Billing email" value={<span className="text-base font-semibold break-all">{account?.billing_email || 'Not set yet'}</span>} />
						</AppStatGrid>
                        
                        <div className="mt-6 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsTopUpModalOpen(true)}
                                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Add Funds
                            </button>
                        </div>
                        
                        <WalletTopUpModal 
                            isOpen={isTopUpModalOpen}
                            onClose={() => setIsTopUpModalOpen(false)}
                            onSuccess={() => {
                                api.getBillingAccount().then(raw => {
                                    const data = normalizeBillingAccount(raw);
                                    if (data) setAccount(data);
                                });
                            }}
                        />
						</>
					)}

					<div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3">
						{isInternalUnlimited ? (
							<AppCallout variant="success" className="mb-0">
								This Koreshield team account is provisioned with internal unlimited enterprise access. Hosted checkout and customer portal are not needed.
							</AppCallout>
						) : !hasPolarCustomer ? (
							<AppCallout variant="info" className="mb-0">
								Customer portal access becomes available after your first completed checkout. Choose a plan below, finish checkout, then refresh this page.
							</AppCallout>
						) : (
							<AppPrimaryButton onClick={() => void handlePortal()} disabled={busyAction === 'portal' || loading}>
								<ArrowUpRight className="h-4 w-4" />
								Open customer portal
							</AppPrimaryButton>
						)}
					</div>
				</AppPageSection>

				<AppPageSection title="Plan details" description="Your active entitlements and usage allowances." variant="card" className="mb-0">
					<div className="space-y-3 text-sm">
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Recurring interval</span>
							<span className="font-medium capitalize">{account?.metadata?.recurring_interval || 'n/a'}</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Active meters</span>
							<span className="font-medium">{account?.metadata?.active_meter_count ?? 0}</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Granted benefits</span>
							<span className="font-medium">{account?.metadata?.granted_benefits?.length ?? 0}</span>
						</div>
						{isInternalUnlimited ? (
							<>
								<div className="flex justify-between gap-4">
									<span className="text-muted-foreground">Protected requests</span>
									<span className="font-medium">{account?.metadata?.protected_requests ?? 'unlimited'}</span>
								</div>
								<div className="flex justify-between gap-4">
									<span className="text-muted-foreground">Support</span>
									<span className="font-medium capitalize">{account?.metadata?.support ?? 'priority'}</span>
								</div>
							</>
						) : null}
					</div>
					<div className="mt-6 border-t border-border pt-5">
						<div className="mb-3 flex items-center justify-between gap-3">
							<h3 className="text-sm font-bold text-foreground">Platform access</h3>
							<span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
								{allowedFeatures.length} unlocked
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{allowedFeatures.map((feature) => (
								<span key={feature} className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
									<CheckCircle2 className="h-3.5 w-3.5" />
									{FEATURE_LABELS[feature]}
								</span>
							))}
						</div>
						{lockedFeatures.length ? (
							<div className="mt-4">
								<p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Upgrade unlocks</p>
								<div className="flex flex-wrap gap-2">
									{lockedFeatures.slice(0, 8).map((feature) => (
										<span key={feature} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
											<Lock className="h-3.5 w-3.5" />
											{FEATURE_LABELS[feature]}
										</span>
									))}
								</div>
							</div>
						) : null}
					</div>
				</AppPageSection>
			</div>

			<AppPageSection
				title="Upgrade plans"
				description="Choose a plan that fits your protected-request volume. Switch between monthly and annual billing below."
				actions={
					<div className="inline-flex rounded-xl border border-border bg-background/60 p-1">
						<button
							type="button"
							onClick={() => setBillingPeriod('monthly')}
							className={`rounded-lg px-4 py-2 text-sm transition-colors ${billingPeriod === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						>
							Monthly
						</button>
						<button
							type="button"
							onClick={() => setBillingPeriod('annual')}
							className={`rounded-lg px-4 py-2 text-sm transition-colors ${billingPeriod === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						>
							Annual
						</button>
					</div>
				}
			>
				{isInternalUnlimited ? (
					<AppCallout variant="success">
						This account is provisioned with internal Enterprise access. Hosted checkout is not applicable.
					</AppCallout>
				) : null}

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{hostedPlans.map((plan) => {
						const productId = getHostedCheckoutProductId(plan.id, billingPeriod);
						const missingProduct = !productId;
						const isRecommendedUpgrade = requestedFeaturePlan === plan.id;
						return (
							<AppSurface
								key={plan.id}
								className={isRecommendedUpgrade ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10' : undefined}
							>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="text-lg font-bold tracking-[-0.03em]">{plan.name}</h3>
											{isRecommendedUpgrade ? (
												<span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
													Recommended
												</span>
											) : null}
										</div>
										<p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
									</div>
									<div className="text-left sm:text-right">
										<div className="text-xs uppercase tracking-wide text-muted-foreground">{billingPeriod === 'annual' ? 'Annual' : 'Monthly'}</div>
										<div className="text-lg font-semibold">{billingPeriod === 'annual' ? plan.annualPriceLabel : plan.monthlyPriceLabel}</div>
									</div>
								</div>

								<AppSurface className="mt-4 bg-muted/40">
									<div className="font-medium text-foreground">{plan.includedRequests}</div>
									<div className="mt-1 text-sm text-muted-foreground">{plan.retention}</div>
									{plan.overage ? <div className="mt-2 text-sm text-muted-foreground">{plan.overage}</div> : null}
								</AppSurface>

								{missingProduct ? (
									<AppCallout variant="warning" className="mt-4 mb-0">
										Checkout is not available right now. Please contact support.
									</AppCallout>
								) : null}

								<AppSecondaryButton
									onClick={() => void handleCheckout(productId, plan.id, billingPeriod)}
									disabled={busyAction === productId || missingProduct || isInternalUnlimited}
									className="mt-6 w-full sm:w-auto"
								>
									<ArrowUpRight className="h-4 w-4" />
									{isInternalUnlimited
										? 'Included with internal Enterprise access'
										: busyAction === productId
											? 'Opening checkout...'
											: `Choose ${plan.name}`}
								</AppSecondaryButton>
							</AppSurface>
						);
					})}
				</div>
			</AppPageSection>
		</AppPage>
	);
}
