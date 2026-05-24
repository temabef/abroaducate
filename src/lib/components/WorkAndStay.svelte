<script lang="ts">
	import { Briefcase, Clock, Home, TrendingUp, ExternalLink } from 'lucide-svelte';
	import { getWorkAndStay } from '$lib/data/workAndStay';

	let { country }: { country: string } = $props();

	const data = $derived(getWorkAndStay(country));
</script>

{#if data}
<div class="was-card">
	<div class="was-header">
		<div class="was-header-left">
			<span class="was-flag">{data.flag}</span>
			<div>
				<h3 class="was-title">Work & Stay in {data.country}</h3>
				<p class="was-subtitle">What happens after you graduate</p>
			</div>
		</div>
		<a href={data.officialLink} target="_blank" rel="noopener noreferrer" class="was-official-link">
			Official info <ExternalLink size={12} />
		</a>
	</div>

	<div class="was-grid">
		<!-- Student work rights -->
		<div class="was-item">
			<div class="was-item-icon" style="background:#fff7ed;color:#ea580c;">
				<Briefcase size={18} />
			</div>
			<div class="was-item-body">
				<p class="was-item-label">Work while studying</p>
				<p class="was-item-value">
					{#if data.studentWorkRights.hoursPerWeek >= 999}
						Unlimited hours
					{:else}
						{data.studentWorkRights.hoursPerWeek} hrs/week
					{/if}
				</p>
				<p class="was-item-note">{data.studentWorkRights.notes}</p>
			</div>
		</div>

		<!-- Student min wage -->
		<div class="was-item">
			<div class="was-item-icon" style="background:#f0fdf4;color:#16a34a;">
				<TrendingUp size={18} />
			</div>
			<div class="was-item-body">
				<p class="was-item-label">Student pay rate</p>
				<p class="was-item-value">{data.studentMinWage.amount}/{data.studentMinWage.per}</p>
				<p class="was-item-note">{data.studentMinWage.notes}</p>
			</div>
		</div>

		<!-- Post-study visa -->
		<div class="was-item">
			<div class="was-item-icon" style="background:#eff6ff;color:#2563eb;">
				<Clock size={18} />
			</div>
			<div class="was-item-body">
				<p class="was-item-label">Stay after graduation</p>
				<p class="was-item-value">{data.postStudyVisa.duration}</p>
				<p class="was-item-note">{data.postStudyVisa.name} — {data.postStudyVisa.notes}</p>
			</div>
		</div>

		<!-- Path to PR -->
		<div class="was-item">
			<div class="was-item-icon" style="background:#faf5ff;color:#7c3aed;">
				<Home size={18} />
			</div>
			<div class="was-item-body">
				<p class="was-item-label">Path to residency</p>
				<p class="was-item-value">{data.pathToPR.yearsRequired} years</p>
				<p class="was-item-note">{data.pathToPR.notes}</p>
			</div>
		</div>
	</div>

	<!-- Graduate salary highlight -->
	<div class="was-salary">
		<div class="was-salary-left">
			<p class="was-salary-label">Average graduate salary</p>
			<p class="was-salary-value">{data.averageGraduateSalary.amount}/year</p>
		</div>
		<p class="was-salary-note">{data.averageGraduateSalary.notes}</p>
	</div>
</div>
{/if}

<style>
	.was-card {
		background: white;
		border: 1.5px solid #e2e8f0;
		border-radius: 1.25rem;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.was-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f1f5f9;
		background: #f8fafc;
	}

	.was-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.was-flag {
		font-size: 1.75rem;
		line-height: 1;
	}

	.was-title {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		font-weight: 800;
		color: #0f172a;
		margin: 0 0 2px;
	}

	.was-subtitle {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0;
		font-weight: 500;
	}

	.was-official-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.was-official-link:hover {
		color: #f97316;
		border-color: #f97316;
	}

	.was-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	.was-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f1f5f9;
		border-right: 1px solid #f1f5f9;
	}

	.was-item:nth-child(2n) {
		border-right: none;
	}

	.was-item:nth-child(3),
	.was-item:nth-child(4) {
		border-bottom: none;
	}

	.was-item-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.was-item-body {
		min-width: 0;
	}

	.was-item-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #94a3b8;
		margin: 0 0 2px;
	}

	.was-item-value {
		font-family: 'Outfit', sans-serif;
		font-size: 1.1rem;
		font-weight: 800;
		color: #0f172a;
		margin: 0 0 4px;
	}

	.was-item-note {
		font-size: 0.72rem;
		color: #64748b;
		line-height: 1.5;
		margin: 0;
	}

	.was-salary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #0f172a, #1e293b);
	}

	.was-salary-left {
		flex-shrink: 0;
	}

	.was-salary-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #94a3b8;
		margin: 0 0 2px;
	}

	.was-salary-value {
		font-family: 'Outfit', sans-serif;
		font-size: 1.25rem;
		font-weight: 800;
		color: #f97316;
		margin: 0;
	}

	.was-salary-note {
		font-size: 0.78rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0;
		text-align: right;
	}

	@media (max-width: 600px) {
		.was-grid {
			grid-template-columns: 1fr;
		}

		.was-item {
			border-right: none;
		}

		.was-item:nth-child(3) {
			border-bottom: 1px solid #f1f5f9;
		}

		.was-salary {
			flex-direction: column;
			align-items: flex-start;
		}

		.was-salary-note {
			text-align: left;
		}
	}
</style>
