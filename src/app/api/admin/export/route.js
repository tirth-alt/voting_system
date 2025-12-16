import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { requireDean } from '@/lib/adminAuth';
import { Parser } from 'json2csv';

/**
 * GET /api/admin/export
 * Export results as CSV (Dean-only)
 */
export async function GET() {
    try {
        const auth = await requireDean();
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        await connectDB();

        const candidates = await Candidate.find({ isNota: false }).sort({
            positionId: 1,
            total_points: -1,
            pref1_count: -1
        }).lean();

        const fields = [
            { label: 'Position', value: 'positionId' },
            { label: 'Candidate ID', value: 'id' },
            { label: 'Name', value: 'name' },
            { label: 'House', value: 'house' },
            { label: 'Pref1 Count', value: 'pref1_count' },
            { label: 'Pref2 Count', value: 'pref2_count' },
            { label: 'Total Points', value: 'total_points' }
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(candidates);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=election_results_${Date.now()}.csv`
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
