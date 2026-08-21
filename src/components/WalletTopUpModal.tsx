import { useState } from 'react';
import { X, CreditCard, Shield, Zap } from 'lucide-react';
import { api } from '../lib/api-client';

export type TopUpTier = {
	amount_cents: number;
	requests: number;
	label: string;
};

const TIERS: TopUpTier[] = [
	{ amount_cents: 1000, requests: 1000000, label: '$10' },
	{ amount_cents: 5000, requests: 5000000, label: '$50' },
	{ amount_cents: 20000, requests: 20000000, label: '$200' },
];

export function WalletTopUpModal({
	isOpen,
	onClose,
	onSuccess,
}: {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [selectedTier, setSelectedTier] = useState<TopUpTier | null>(TIERS[1]);
	const [isCustom, setIsCustom] = useState(false);
	const [customAmountStr, setCustomAmountStr] = useState("50");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) return null;

	const customAmount = parseInt(customAmountStr, 10) || 0;
	const customAmountCents = customAmount * 100;
	const isValidCustom = customAmount >= 10;
	const requestsForCustom = customAmount * 100000;

	const amountToCharge = isCustom ? customAmountCents : (selectedTier?.amount_cents || 0);
	const labelToCharge = isCustom ? `$${customAmount}` : (selectedTier?.label || '');
	const canSubmit = !loading && (isCustom ? isValidCustom : selectedTier !== null);

	const handleTopUp = async () => {
		if (!canSubmit) return;
		setLoading(true);
		setError(null);
		try {
			await api.fundWallet(amountToCharge);
			onSuccess();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Top-up failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
			<div className="w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl">
				<div className="flex items-center justify-between border-b px-6 py-4">
					<h3 className="font-semibold text-lg">Load Protected Requests</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-1 hover:bg-muted"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="p-6">
					<p className="mb-6 text-sm text-muted-foreground">
						Koreshield operates on a prepaid wallet model. Add funds to your wallet to
						ensure continuous protection for your AI traffic.
					</p>

					<div className="mb-6 space-y-3">
						{TIERS.map((tier) => (
							<button
								type="button"
								key={tier.amount_cents}
								onClick={() => {
									setSelectedTier(tier);
									setIsCustom(false);
								}}
								className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
									!isCustom && selectedTier?.amount_cents === tier.amount_cents
										? 'border-primary bg-primary/10 ring-1 ring-primary'
										: 'hover:border-primary/50 hover:bg-muted/50'
								}`}
							>
								<div>
									<div className="font-semibold text-foreground">{tier.label}</div>
									<div className="text-sm text-muted-foreground">
										{(tier.requests / 1000000).toFixed(1)}M requests
									</div>
								</div>
								{!isCustom && selectedTier?.amount_cents === tier.amount_cents && (
									<Shield className="h-5 w-5 text-primary" />
								)}
							</button>
						))}

						{/* Custom Amount Option */}
						<div
							className={`w-full rounded-xl border p-4 text-left transition-colors cursor-pointer ${
								isCustom
									? 'border-primary bg-primary/10 ring-1 ring-primary'
									: 'hover:border-primary/50 hover:bg-muted/50'
							}`}
							onClick={() => setIsCustom(true)}
						>
							<div className="flex items-center justify-between">
								<div className="font-semibold text-foreground">Custom Amount</div>
								{isCustom && <Shield className="h-5 w-5 text-primary" />}
							</div>
							
							{isCustom ? (
								<div className="mt-3">
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
										<input 
											type="number"
											min="10"
											value={customAmountStr}
											onChange={(e) => setCustomAmountStr(e.target.value)}
											className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
											placeholder="Enter amount (min 10)"
										/>
									</div>
									<div className="mt-2 flex items-center justify-between text-xs">
										<span className="text-muted-foreground">
											{(requestsForCustom / 1000000).toFixed(1)}M requests
										</span>
										{!isValidCustom && customAmountStr.length > 0 && (
											<span className="text-destructive">Minimum $10</span>
										)}
									</div>
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									Enter a custom amount (min $10)
								</div>
							)}
						</div>
					</div>

					{error && (
						<div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<button
						type="button"
						onClick={handleTopUp}
						disabled={!canSubmit}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{loading ? (
							<Zap className="h-4 w-4 animate-pulse" />
						) : (
							<CreditCard className="h-4 w-4" />
						)}
						{loading ? 'Processing...' : `Pay ${labelToCharge}`}
					</button>
				</div>
			</div>
		</div>
	);
}
