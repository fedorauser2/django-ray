<?php 
/**
 * Example Fibonacci implementation to (n) steps (without recursion)
 * @return array $req Array of Fibonacci numbers
 */
function Fibonacci( $steps = 20 )
{
	list( $cur, $nxt, $inc, $seq ) = array( 0, 1, 1, array() );
	
	do
	{
		$inc++;
		$seq[] = $cur;
		$add   = $cur + $nxt;
		$cur   = $nxt;
		$nxt   = $add;
	} while ( $inc <= $steps );
	
	return $seq;
}

// Example of first 50 Fibonacci numbers
print_r( Fibonacci( 50 ) );
?>
