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
	const [selectedTier, setSelectedTier] = useState<TopUpTier>(TIERS[1]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleTopUp = async () => {
		setLoading(true);
		setError(null);
		try {
			await api.fundWallet(selectedTier.amount_cents);
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
								onClick={() => setSelectedTier(tier)}
								className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
									selectedTier.amount_cents === tier.amount_cents
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
								{selectedTier.amount_cents === tier.amount_cents && (
									<Shield className="h-5 w-5 text-primary" />
								)}
							</button>
						))}
					</div>

					{error && (
						<div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<button
						type="button"
						onClick={handleTopUp}
						disabled={loading}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{loading ? (
							<Zap className="h-4 w-4 animate-pulse" />
						) : (
							<CreditCard className="h-4 w-4" />
						)}
						{loading ? 'Processing...' : `Pay ${selectedTier.label}`}
					</button>
				</div>
			</div>
		</div>
	);
}
